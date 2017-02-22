define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/Deferred',
    'dojo/promise/all',
    'JBrowse/View/Track/CanvasFeatures',
    'JBrowse/Model/SimpleFeature',
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
    SimpleFeature,
    CodonTable,
    Util
) {
    return declare(CanvasFeatures, {
        defaultFeatureDetail: function (/** JBrowse.Track */ track, /** Object */ f, /** HTMLElement */ featDiv, /** HTMLElement */ container) {
            var cc = container || dojo.create('div', { className: 'detail feature-detail feature-detail-' + track.name.replace(/\s+/g, '_').toLowerCase(), innerHTML: '' });

            this._renderCoreDetails(track, f, featDiv, cc);

            if (f.get('type') === 'mRNA' || f.get('type') === 'transcript') {
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
                coreDetails.innerHTML += '<pre style="word-wrap: break-word;white-space: pre-wrap;">>' + (f.get('name') || f.get('id')) + '\n' + seq + '</pre>';
            });
        },
        _getProteinSequence: function (feature) {
            var c = new CodonTable();
            var deferred = new Deferred();
            var codons = c.generateCodonTable(lang.mixin(c.defaultCodonTable, this.browser.config.codonTable));
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
            var prev = '';


            if (feature.get('strand') === -1) {
                subparts.sort(function (a, b) { return b.get('start') > a.get('start'); });
            }
            this.browser.getStore('refseqs', function (store) {
                var proteinSequence = '';
                var wait = 0;
                for (var i = 0; i < subparts.length; ++i) {
                    var subpart = subparts[i];
                    if (subpart.get('type') === 'CDS') {
                        wait++;
                        store.getReferenceSequence({ ref: subpart.get('seq_id'), start: subpart.get('start'), end: subpart.get('end') }, (function (feat) {
                            return function (seq) {
                                var subfeat = feat;
                                var mseq = seq;
                                var phase = subfeat.get('phase');
                                var n = Math.floor(mseq.length / 3) * 3;
                                var remainder = (mseq.length + prev.length) % 3;

                                if (subfeat.get('strand') === -1) {
                                    mseq = Util.revcom(mseq);
                                    if (prev) {
                                        if (phase !== 3 - prev.length) {
                                            console.log('warning: reading frame phase is off', prev, phase);
                                        }
                                        proteinSequence += codons[prev + mseq.substring(0, 3 - prev.length)];
                                        prev = '';
                                    }
                                    for (var j = phase; j < n; j += 3) {
                                        if (j + 3 <= mseq.length) {
                                            proteinSequence += codons[mseq.substring(j, j + 3)];
                                        }
                                    }
                                    if (remainder) {
                                        prev = mseq.substring(mseq.length - remainder, mseq.length);
                                    }
                                } else {
                                    if (prev) {
                                        if (phase !== 3 - prev.length) {
                                            console.log('warning: reading frame phase is off', prev, phase);
                                        }

                                        proteinSequence += codons[prev + mseq.substring(0, 3 - prev.length)];
                                        prev = '';
                                    }
                                    for (var j = phase; j < n; j += 3) {
                                        if (j + 3 <= mseq.length) {
                                            proteinSequence += codons[mseq.substring(j, j + 3)];
                                        }
                                    }
                                    if (remainder) {
                                        prev = mseq.substring(mseq.length - remainder, mseq.length);
                                    }
                                }
                                wait--;
                            };
                        })(subpart));
                    }
                }
                var waiter = function () {
                    if (wait === 0) {
                        deferred.resolve(proteinSequence[proteinSequence.length - 1] === '*' ?
                            proteinSequence.slice(0, -1) :  proteinSequence + '\nWARNING: No stop codon');
                    } else {
                        setTimeout(waiter, 100);
                    }
                };
                waiter();
            });

            return deferred;
        }
    });
});
