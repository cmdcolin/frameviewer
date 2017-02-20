define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'JBrowse/Util',
    './Base'
],
function (
    declare,
    array,
    lang,
    Util,
    Base
) {
    return declare(Base, {
        _defaultConfig: function () {
            return Util.deepUpdate(lang.clone(this.inherited(arguments)), {
                glyph: 'FrameViewer/View/FeatureGlyph/Frames',
                style: {
                    frameHeight: 50
                }
            });
        }
    });
});
