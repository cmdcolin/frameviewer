define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/Deferred',
    'dojo/promise/all',
    'JBrowse/View/Track/CanvasFeatures',
    'JBrowse/CodonTable',
    'JBrowse/Util'
],
function (
    declare,
    array,
    lang,
    Deferred,
    all,
    CanvasFeatures,
    CodonTable,
    Util
) {
    return declare(CanvasFeatures, {
        _defaultConfig: function () {
            return Util.deepUpdate(lang.clone(this.inherited(arguments)), {
                glyph: 'FrameViewer/View/FeatureGlyph/Frames',
                style: {
                    frameHeight: 50
                }
            });
        },

        defaultFeatureDetail: function (/** JBrowse.Track */ track, /** Object */ f, /** HTMLElement */ featDiv, /** HTMLElement */ container) {
            var cc = container || dojo.create('div', { className: 'detail feature-detail feature-detail-' + track.name.replace(/\s+/g, '_').toLowerCase(), innerHTML: '' });

            this._renderCoreDetails(track, f, featDiv, cc);

            if (f.get('type') === 'mRNA') {
                this._renderProteinSequence(track, f, featDiv, cc);
            }

            this._renderAdditionalTagsDetail(track, f, featDiv, cc);

            this._renderUnderlyingReferenceSequence(track, f, featDiv, cc);

            this._renderSubfeaturesDetail(track, f, featDiv, cc);

            if (typeof this.extendedRender === 'function') {
                this.extendedRender(track, f, featDiv, cc);
            }

            return cc;
        },


        _renderProteinSequence: function (track, f, featDiv, container) {
            var coreDetails = dojo.create('div', { className: 'core' }, container);
            coreDetails.innerHTML += '<h2 class="sectiontitle">Protein sequence<h2>';

            this._getProteinSequence(f).then(function (seq) {
                coreDetails.innerHTML += '<pre style="word-wrap: break-word;white-space: pre-wrap;">>' + f.get('name') + '\n' + seq + '</pre>';
            });
        },
        _getProteinSequence: function (feature) {
            var c = new CodonTable();
            var codons = c.generateCodonTable(lang.mixin(c.defaultCodonTable, this.browser.config.codonTable));
            var subparts = feature.children();
            this.prev = '';

            var promises = [];
            var thisB = this;


            for (var i = 0; i < subparts.length; ++i) {
                var s = subparts[i];
                if (s.get('type') === 'CDS') {
                    var d = new Deferred();
                    promises.push(d);
                    this.browser.getStore('refseqs', (function (feat, deferred) {
                        return function (store) {
                            store.getReferenceSequence({ ref: feat.get('seq_id'), start: feat.get('start'), end: feat.get('end') }, function (seq) {
                                deferred.resolve({ seq: seq, feat: feat });
                            });
                        };
                    })(s, d));
                }
            }
            return all(promises).then(function (arr) {
                var proteinSequence = '';

                for (var iter = 0; iter < arr.length; iter++) {
                    var subfeat = arr[iter].feat;
                    var seq = arr[iter].seq;
                    var n = Math.floor(seq.length / 3) * 3;
                    var remainder = (seq.length + thisB.prev.length) % 3;
                    var phase = subfeat.get('phase');

                    if (subfeat.get('strand') === -1) {
                        seq = Util.revcom(seq);
                        if (thisB.prev) {
                            proteinSequence += codons[thisB.prev + seq.substring(0, phase)];
                            thisB.prev = '';
                        }
                        for (var j = phase; j < n; j += 3) {
                            proteinSequence += codons[seq.substring(j, j + 3)];
                        }
                        if (remainder) {
                            thisB.prev = seq.substring(seq.length - remainder, seq.length);
                        }
                    } else {
                        if (thisB.prev && phase) {
                            proteinSequence += codons[thisB.prev + seq.substring(0, phase)];
                            thisB.prev = '';
                        }
                        for (var j = phase; j < n; j += 3) {
                            if (j + 3 <= seq.length) {
                                proteinSequence += codons[seq.substring(j, j + 3)];
                            }
                        }
                        if (remainder) {
                            thisB.prev = seq.substring(seq.length - remainder, seq.length);
                        }
                    }
                }
                return proteinSequence[proteinSequence.length - 1] === '*' ?
                    proteinSequence.slice(0, -1) :  proteinSequence + '\nWARNING: No stop codon';
            });
        }
    });
});
