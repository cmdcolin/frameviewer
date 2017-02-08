define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojox/color/Palette',
    'JBrowse/Model/SimpleFeature',
    'JBrowse/View/FeatureGlyph/ProcessedTranscript'
],
function (
    declare,
    array,
    Palette,
    SimpleFeature,
    ProcessedTranscript
) {
    return declare(ProcessedTranscript, {
        renderFeature: function (context, fRect) {
            var viewInfo = fRect.viewInfo;
            var fh = this.config.style.frameHeight;
            context.clearRect(Math.floor(fRect.l), fRect.t, Math.ceil(fRect.w), fRect.h);

            this.renderFrames(context, fRect);

            var subparts = this._getSubparts(fRect.f);

            for (var i = 0; i < subparts.length; ++i) {
                var s = subparts[i];
                if (s.get('type') === 'CDS') {
                    var frame = s.get('start') % 3 + 1;
                    var left  = viewInfo.block.bpToX(s.get('start'));
                    var width = viewInfo.block.bpToX(s.get('end')) - left;
                    context.fillRect(left, fRect.t + fh * frame / 4 - fh / 12, Math.max(1, width), fh / 6);
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
