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

            var drawDNA = function (left, top, del, feat) {
                return function (seq) {
                    if(feat.get('strand') == -1) {
                        seq = Util.complement(seq);
                    }
                    for (var j = 0; j < seq.length; j++) {
                        context.fillStyle = 'white';
                        context.fillText(seq[j], left + j * del, top);
                    }
                };
            };

            if(this.config.showProtein) {
                this.track.browser.getStore('refseqs', function (store) {
                    context.fillStyle = 'white';
                    var fstart = feature.get('start');
                    var fend = feature.get('end');
                    store.getReferenceSequence({ ref: feature.get('seq_id'), start: fstart, end: fend }, function(seq) {
                        var s = '';
                        var ret = {};
                        if(feature.get('strand') == -1) {
                            subparts.forEach(function(s) {
                                ret[s.get('start')] = Util.revcom(seq.substring(s.get('start') - fstart, s.get('end') - fstart));

                            });
                            Object.keys(ret).sort(function(a, b) { return a < b; }).forEach(function(elt) {
                                s += ret[elt];
                            });
                        }
                        else {
                            subparts.forEach(function(s) {
                                ret[s.get('start')] = seq.substring(s.get('start') - fstart, s.get('end') - fstart);

                            });
                            Object.keys(ret).sort(function(a, b) { return a < b; }).forEach(function(elt) {
                                s += ret[elt];
                            });
                        }
                        if(thisB.config.showProtein) {

                        }
                    });
                    //drawProtein(left, fRect.t + fh * (frame + 1) / 4 + fh / 16, delta, s));
                });

            }

            var drawProtein = function (left, top, del, feat) {
                this.prev = '';
                var thisB = this;
                return function (seq) {
                    var n = Math.floor(seq.length / 3) * 3;
                    var remainder = seq.length % 3;
                    var phase = feat.get('phase');
                    if(feat.get('strand') == -1) {
                        if (this.prev) {
                            context.fillStyle = 'black';
                            context.fillText(codons[Util.revcom(seq.substring(0, phase)) + thisB.prev], left - (3 - phase) * del, top);
                        }
                        for (var j = seq.length; j > 0; j -= 3) {
                            context.fillStyle = 'white';
                            var ret = Util.revcom(seq.substring(j - 3, j));
                            context.fillText(codons[ret], left + (j-1) * del, top);
                        }
                        if (remainder) {
                            thisB.prev = Util.revcom(seq.substring(seq.length - remainder, seq.length));
                        }
                    } else {
                        if (this.prev) {
                            context.fillStyle = 'black';
                            context.fillText(codons[thisB.prev + seq.substring(0, phase)], left - (3 - phase) * del, top);
                        }
                        for (var j = phase; j < n; j += 3) {
                            context.fillStyle = 'white';
                            context.fillText(codons[seq.substring(j, j + 3)], left + j * del, top);
                        }
                        if (remainder) {
                            thisB.prev = seq.substring(seq.length - remainder, seq.length);
                        }
                    }
                };
            };

            for (var i = 0; i < subparts.length; ++i) {
                var s = subparts[i];
                context.fillStyle = 'black';
                if (s.get('type') === 'CDS') {
                    var frame = s.get('strand') === 1 ?
                        (s.get('start') % 3) :
                        (s.get('end') % 3);

                    var left  = viewInfo.block.bpToX(s.get('start'));
                    var right  = viewInfo.block.bpToX(s.get('start') + 1);
                    var delta = right - left;
                    var width = viewInfo.block.bpToX(s.get('end')) - left;
                    context.fillRect(left, fRect.t + fh * (frame + 1) / 4 - fh / 12, Math.max(1, width), fh / 6);
                    context.font = '8px';
//                    if (this.config.showDNA && viewInfo.block.scale > 5) {
//                        this.track.browser.getStore('refseqs', function (store) {
//                            store.getReferenceSequence({ ref: s.get('seq_id'), start: s.get('start'), end: s.get('end') }, drawDNA(left, fRect.t + fh * (frame + 1) / 4 + fh / 16, delta, s));
//                        });
//                    }
//                    if (this.config.showProtein && viewInfo.block.scale > 3) {
//                        this.track.browser.getStore('refseqs', function (store) {
//                            context.fillStyle = 'white';
//                            store.getReferenceSequence({ ref: s.get('seq_id'), start: s.get('start'), end: s.get('end') }, drawProtein(left, fRect.t + fh * (frame + 1) / 4 + fh / 16, delta, s));
//                        });
//                    }
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
                    fRect.rect.l, // left
                    Math.round(fRect.rect.t + this.config.style.frameHeight / 4), // top
                    fRect.rect.w, // width
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
