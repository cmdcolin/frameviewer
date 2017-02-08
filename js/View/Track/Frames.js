define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'JBrowse/View/Track/CanvasFeatures',
    'JBrowse/Util'
],
function (
    declare,
    array,
    lang,
    CanvasFeatures,
    Util
) {
    return declare(CanvasFeatures, {
        _defaultConfig: function() {
            return Util.deepUpdate(lang.clone(this.inherited(arguments)), {
                glyph: 'FrameViewer/View/FeatureGlyph/Frames',
                style: {
                    frameHeight: 50
                }
            });
        }
    });
});
