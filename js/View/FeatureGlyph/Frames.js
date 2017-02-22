define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/promise/all',
    'dojo/Deferred',
    'JBrowse/Store/LRUCache',
    'JBrowse/Model/SimpleFeature',
    'JBrowse/View/FeatureGlyph/ProcessedTranscript',
    'JBrowse/CodonTable',
    'JBrowse/Util'
],
function (
    declare,
    array,
    lang,
    all,
    Deferred,
    LRUCache,
    SimpleFeature,
    ProcessedTranscript,
    CodonTable,
    Util
) {
    return declare(ProcessedTranscript, {
        renderFeature: function (context, fRect) {
            var thisB = this;
            var c = new CodonTable();
            var codons = c.generateCodonTable(lang.mixin(c.defaultCodonTable, this.track.browser.config.codonTable));
            var viewInfo = fRect.viewInfo;
            var frameHeight = this.config.style.frameHeight;
            var feature = fRect.f;
            var sub = feature.children();
            var subparts = array.map(sub, function (ret) {
                return new SimpleFeature({
                    data: {
                        start: ret.get('start'),
                        name: ret.get('name'),
                        phase: ret.get('phase'),
                        strand: ret.get('strand'),
                        end: ret.get('end'),
                        type: ret.get('type'),
                        seq_id: ret.get('seq_id')
                    }
                });
            });
            context.clearRect(Math.floor(fRect.l), fRect.t, Math.ceil(fRect.w), fRect.h);
            var prev = '';

            this.renderFrames(context, fRect);


            if (feature.get('strand') === -1) {
                subparts.sort(function (a, b) { return b.get('start') > a.get('start'); });
            }
            this.track.browser.getStore('refseqs', function (store) {
                for (var i = 0; i < subparts.length; ++i) {
                    var subpart = subparts[i];
                    if (subpart.get('type') === 'CDS') {
                        store.getReferenceSequence({ ref: subpart.get('seq_id'), start: subpart.get('start'), end: subpart.get('end') }, (function (feat) {
                            return function (seq) {
                                var subfeat = feat;
                                var mseq = seq;
                                var phase = subfeat.get('phase');
                                var start = subfeat.get('start') + phase;
                                var end = subfeat.get('end') - phase;

                                var frame = subfeat.get('strand') === 1 ?
                                    (2 - (((start) % 3 + 3) % 3)) : // top is the 2nd frame
                                    ((end % 3 + 3) % 3); // bottom is 2nd frame;
                                var left  = viewInfo.block.bpToX(subfeat.get('start'));
                                var delta = viewInfo.block.bpToX(subfeat.get('start') + 1) - left;
                                var width = viewInfo.block.bpToX(subfeat.get('end')) - left;
                                var top = fRect.t + frameHeight * (frame + 1) / 4;
                                context.fillStyle = 'black';
                                context.fillRect(left, top - frameHeight / 12, Math.max(1, width), frameHeight / 6);

                                context.font = '8px';
                                if (thisB.config.showDNA && viewInfo.block.scale > 5) {
                                    if (subfeat.get('strand') === -1) {
                                        mseq = Util.complement(mseq);
                                    }
                                    for (var j = 0; j < mseq.length; j++) {
                                        context.fillStyle = 'white';
                                        context.fillText(mseq[j], left + j * delta + 3, top + 3);
                                    }
                                } else if (thisB.config.showProtein && viewInfo.block.scale > 3) {
                                    var n = Math.floor(mseq.length / 3) * 3;
                                    var remainder = (mseq.length + prev.length) % 3;

                                    if (subfeat.get('strand') === -1) {
                                        mseq = Util.revcom(mseq);
                                        if (prev) {
                                            context.fillStyle = 'black';
                                            if (phase !== 3 - prev.length) {
                                                console.log('warning: reading frame phase is off', prev, phase);
                                            }
                                            context.fillText(codons[prev + mseq.substring(0, 3 - prev.length)], left + (mseq.length + prev.length) * delta, top + 3);
                                            prev = '';
                                        }
                                        for (var j = phase; j < n; j += 3) {
                                            context.fillStyle = 'white';
                                            if (j + 3 <= mseq.length) {
                                                context.fillText(codons[mseq.substring(j, j + 3)], left + (mseq.length - j - 1) * delta, top + 3);
                                            }
                                        }
                                        if (remainder) {
                                            prev = mseq.substring(mseq.length - remainder, mseq.length);
                                        }
                                    } else {
                                        if (prev) {
                                            context.fillStyle = 'black';
                                            if (phase !== 3 - prev.length) {
                                                console.log('warning: reading frame phase is off', prev, phase);
                                            }

                                            context.fillText(codons[prev + mseq.substring(0, 3 - prev.length)], left - prev.length * delta + 3, top + 3);
                                            prev = '';
                                        }
                                        for (var j = phase; j < n; j += 3) {
                                            context.fillStyle = 'white';
                                            if (j + 3 <= mseq.length) {
                                                context.fillText(codons[mseq.substring(j, j + 3)], left + j * delta + 3, top + 3);
                                            }
                                        }
                                        if (remainder) {
                                            prev = mseq.substring(mseq.length - remainder, mseq.length);
                                        }
                                    }
                                }
                            };
                        })(subpart));
                    }
                }
            });
        },


        renderFrames: function (context, fRect) {
            // connector
            var connectorColor = this.getStyle(fRect.f, 'connectorColor');
            if (connectorColor) {
                context.fillStyle = connectorColor;
                var connectorThickness = this.getStyle(fRect.f, 'connectorThickness');
                context.fillRect(
                    fRect.rect.l,
                    Math.round(fRect.rect.t + this.config.style.frameHeight / 4),
                    fRect.rect.w,
                    connectorThickness
                );
                context.fillRect(
                    fRect.rect.l, // left
                    Math.round(fRect.rect.t + this.config.style.frameHeight / 2), // top
                    fRect.rect.w, // width
                    connectorThickness
                );
                context.fillRect(
                    fRect.rect.l, // left
                    Math.round(fRect.rect.t + this.config.style.frameHeight * 3 / 4), // top
                    fRect.rect.w, // width
                    connectorThickness
                );
            }
        },
        _getFeatureHeight: function () {
            return this.config.style.frameHeight;
        }
    });
});
