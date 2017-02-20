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
            var c = new CodonTable();
            var codons = c.generateCodonTable(lang.mixin(c.defaultCodonTable, this.track.browser.config.codonTable));
            var viewInfo = fRect.viewInfo;
            var frameHeight = this.config.style.frameHeight;
            var feature = fRect.f;
            var sub = this._getSubparts(feature);
            var subparts = array.map(sub, function(ret) {
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
            })
            var thisB = this;

            var cache = this.chunkCache = this.chunkCache || new LRUCache({
                name: 'FrameCache',
                fillCallback: dojo.hitch(this, '_readChunkItems'),
                sizeFunction: function (chunkItems) {
                    return chunkItems.length;
                },
                maxSize: 10000
            });

            context.clearRect(Math.floor(fRect.l), fRect.t, Math.ceil(fRect.w), fRect.h);

            this.renderFrames(context, fRect);


            if (feature.get('strand') === -1) {
                subparts = subparts.sort(function (a, b) { return b.get('start') > a.get('start'); });
            }
            this.track.browser.getStore('refseqs', function (store) {
                var promises = [];
                for (var i = 0; i < subparts.length; ++i) {
                    var s = subparts[i];
                    if (s.get('type') === 'CDS') {
                        var d = new Deferred();
                        promises.push(d);
                        var chunk = { store: store, start: s.get('start'), end: s.get('end'), ref: s.get('seq_id') };
                        chunk.toString = chunk.toUniqueString = function () { return chunk.start + ',' + chunk.end + ',' + chunk.ref; };
                        cache.get(chunk, (function (feat, deferred) {
                            return function (seq) {
                                deferred.resolve({ seq: seq, feat: feat });
                            };
                        })(s, d));
                    }
                }


                all(promises).then(function (arr) {
                    var prev = '';
                    for (var iter = 0; iter < arr.length; iter++) {
                        var subfeat = arr[iter].feat;
                        var seq = arr[iter].seq;
                        var frame = subfeat.get('strand') === 1 ? ((subfeat.get('start') - prev.length) % 3) : ((subfeat.get('end') + prev.length) % 3);
                        var left  = viewInfo.block.bpToX(subfeat.get('start'));
                        var delta = viewInfo.block.bpToX(subfeat.get('start') + 1) - left;
                        var width = viewInfo.block.bpToX(subfeat.get('end')) - left;
                        var top = fRect.t + frameHeight * (frame + 1) / 4;
                        context.fillStyle = 'black';
                        context.fillRect(left, top - frameHeight / 12, Math.max(1, width), frameHeight / 6);

                        context.font = '8px';
                        if (thisB.config.showDNA && viewInfo.block.scale > 5) {
                            if (subfeat.get('strand') === -1) {
                                seq = Util.complement(seq);
                            }
                            for (var j = 0; j < seq.length; j++) {
                                context.fillStyle = 'white';
                                context.fillText(seq[j], left + j * delta + 3, top + 3);
                            }
                        } else if (thisB.config.showProtein && viewInfo.block.scale > 3) {
                            var n = Math.floor(seq.length / 3) * 3;
                            var remainder = (seq.length + prev.length) % 3;
                            var phase = subfeat.get('phase');

                            if (subfeat.get('strand') === -1) {
                                seq = Util.revcom(seq);
                                if (prev) {
                                    context.fillStyle = 'black';
                                    context.fillText(codons[prev + seq.substring(0, phase)], left + (seq.length + 3 - phase) * delta - 3, top + 3);
                                    prev = '';
                                }
                                for (var j = phase; j < n; j += 3) {
                                    context.fillStyle = 'white';
                                    if (j + 3 <= seq.length) {
                                        context.fillText(codons[seq.substring(j, j + 3)], left + (seq.length - j - 1) * delta - 3, top + 3);
                                    }
                                }
                                if (remainder) {
                                    prev = seq.substring(seq.length - remainder, seq.length);
                                }
                            } else {
                                if (prev && phase) {
                                    context.fillStyle = 'black';
                                    context.fillText(codons[prev + seq.substring(0, phase)], left - (3 - phase) * delta + 3, top + 3);
                                    prev = '';
                                }
                                for (var j = phase; j < n; j += 3) {
                                    context.fillStyle = 'white';
                                    if (j + 3 <= seq.length) {
                                        context.fillText(codons[seq.substring(j, j + 3)], left + j * delta + 3, top + 3);
                                    }
                                }
                                if (remainder) {
                                    prev = seq.substring(seq.length - remainder, seq.length);
                                }
                            }
                        }
                    }
                });
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
        },
        _readChunkItems: function (chunk, callback) {
            chunk.store.getReferenceSequence({ ref: chunk.ref, start: chunk.start, end: chunk.end }, function (seq) {
                callback(seq);
            });
        }
    });
});
