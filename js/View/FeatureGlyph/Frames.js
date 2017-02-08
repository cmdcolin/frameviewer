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
        _getFeatureRectangle: function(viewArgs, feature) {
            var ret = this.inherited(arguments);
            ret.h = this.config.frameHeight;
            return ret;
        },
        renderFeature: function (context, fRect) {
            this.renderFrames(context,  fRect);
            this.renderSegments(context, fRect);
        },
        renderSegments: function (context, fRect) {
            var subparts = this._getSubparts(fRect.f);
            if (!subparts.length) {
                return;
            }

            var thisB = this;
            var parentFeature = fRect.f;
            function style(feature, stylename) {
                if (stylename == 'height') {
                    return thisB._getFeatureHeight(fRect.viewInfo, feature);
                }
                return thisB.getStyle(feature, stylename) || thisB.getStyle(parentFeature, stylename);
            }

            for (var i = 0; i < subparts.length; ++i) {
                var start = subparts[i].get('start');
                var frame = start % 3;
                console.log(this.config.style.frameHeight)
                this.renderBox(context, fRect.viewInfo, subparts[i], fRect.t + frame*this.config.style.frameHeight/3, this.config.style.frameHeight/3, fRect.f, style);
            }
        },

        renderFrames: function( context, fRect ) {
            // connector
            var connectorColor = this.getStyle( fRect.f, 'connectorColor' );
            if( connectorColor ) {
                context.fillStyle = connectorColor;
                var connectorThickness = this.getStyle( fRect.f, 'connectorThickness' );
                context.fillRect(
                    fRect.rect.l, // left
                    Math.round(fRect.rect.t), // top
                    fRect.rect.w, // width
                    connectorThickness
                );
                context.fillRect(
                    fRect.rect.l, // left
                    Math.round(fRect.rect.t+this.config.style.frameHeight/3), // top
                    fRect.rect.w, // width
                    connectorThickness
                );
                context.fillRect(
                    fRect.rect.l, // left
                    Math.round(fRect.rect.t+this.config.style.frameHeight*2/3), // top
                    fRect.rect.w, // width
                    connectorThickness
                );
            }
        }
    });
});
