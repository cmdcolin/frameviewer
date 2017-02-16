define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojox/color/Palette',
    'JBrowse/Model/SimpleFeature',
    'JBrowse/View/FeatureGlyph/ProcessedTranscript',
    'JBrowse/CodonTable',
    'JBrowse/Util'
],
function (
    declare,
    array,
    lang,
    Palette,
    SimpleFeature,
    ProcessedTranscript,
    CodonTable,
    Util
) {
    return declare(ProcessedTranscript, {
        renderFeature: function (context, fRect) {
            var c = new CodonTable();
            var codons = c.generateCodonTable(lang.mixin(c.defaultCodonTable, this.track.browser.config.codonTable));

            var viewInfo = fRect.viewInfo;
            var fh = this.config.style.frameHeight;
            var feature = fRect.f;
            context.clearRect(Math.floor(fRect.l), fRect.t, Math.ceil(fRect.w), fRect.h);

            this.renderFrames(context, fRect);

            var subparts = this._getSubparts(feature);

            var drawDNA = function (feat, left, top, del) {
                return function (seq) {
                    var newseq = seq;
                    if (feat.get('strand') === -1) {
                        newseq = Util.complement(seq);
                    }
                    for (var j = 0; j < newseq.length; j++) {
                        context.fillStyle = 'white';
                        context.fillText(newseq[j], left + j * del, top);
                    }
                };
            };

            var drawProtein = function (feat, left, top, del) {
                this.prev = '';
                var thisB = this;
                return function (seq) {
                    var n = Math.floor(seq.length / 3) * 3;
                    var remainder = (seq.length + thisB.prev.length) % 3;
                    var phase = feat.get('phase');
                    var newseq = seq;

                    if (feat.get('strand') === -1) {
                        newseq = Util.revcom(seq);
                        if (thisB.prev) {
                            // out of phase amino
                            context.fillStyle = 'black';
                            context.fillText(codons[thisB.prev + newseq.substring(0, phase)], left + (newseq.length + 3 - phase) * del, top);
                            thisB.prev = '';
                        }
                        for (var j = phase; j < n; j += 3) {
                            context.fillStyle = 'white';
                            var ret = newseq.substring(j, j + 3);
                            context.fillText(codons[ret], left + (newseq.length - j - 1) * del, top);
                        }
                        if (remainder) {
                            thisB.prev = newseq.substring(newseq.length - remainder, newseq.length);
                        }
                    } else {
                        if (thisB.prev && phase) {
                            // out of phase amino
                            context.fillStyle = 'black';
                            context.fillText(codons[thisB.prev + newseq.substring(0, phase)], left - (3 - phase) * del, top);
                            thisB.prev = '';
                        }
                        for (var j = phase; j < n; j += 3) {
                            context.fillStyle = 'white';
                            context.fillText(codons[newseq.substring(j, j + 3)], left + j * del, top);
                        }
                        if (remainder) {
                            thisB.prev = newseq.substring(newseq.length - remainder, newseq.length);
                        }
                    }
                };
            };

            if (feature.get('strand') === -1) {
                subparts = subparts.sort(function (a, b) { return b.get('start') > a.get('start'); });
            }

            for (var i = 0; i < subparts.length; ++i) {
                var s = subparts[i];
                context.fillStyle = 'black';
                if (s.get('type') === 'CDS') {
                    var frame = s.get('strand') === 1 ? (s.get('start') % 3) : (s.get('end') % 3);
                    var left  = viewInfo.block.bpToX(s.get('start'));
                    var right  = viewInfo.block.bpToX(s.get('start') + 1);
                    var delta = right - left;
                    var width = viewInfo.block.bpToX(s.get('end')) - left;
                    context.fillRect(left, fRect.t + fh * (frame + 1) / 4 - fh / 12, Math.max(1, width), fh / 6);
                    context.font = '8px';
                    if (this.config.showDNA && viewInfo.block.scale > 5) {
                        this.track.browser.getStore('refseqs', (function (f, l, t, d) {
                            return function (store) {
                                store.getReferenceSequence({ ref: f.get('seq_id'), start: f.get('start'), end: f.get('end') }, drawDNA(f, l, t, d));
                            };
                        })(s, left, fRect.t + fh * (frame + 1) / 4 + fh / 16, delta));
                    }
                    if (this.config.showProtein && viewInfo.block.scale > 3) {
                        this.track.browser.getStore('refseqs', (function (f, l, t, d) {
                            context.fillStyle = 'white';
                            return function (store) {
                                store.getReferenceSequence({ ref: f.get('seq_id'), start: f.get('start'), end: f.get('end') }, drawProtein(f, l, t, d));
                            };
                        })(s, left, fRect.t + fh * (frame + 1) / 4 + fh / 16, delta));
                    }
                }
            }
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
