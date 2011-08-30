/**
 * @author Lukas Fryc
 */

(function($, rf) {
    rf.ui = rf.ui || {};

    /**
     * Default component configuration
     */
    var defaultOptions = {
        toolbar : 'Basic',
        skin: 'richfaces',
        readonly : false,
        style : '',
        styleClass : '',
        editorStyle : '',
        editorClass : '',
        width : '100%',
        height : '200px'
    };
    
    /**
     * Default CKEditor configuration
     */
    var defaultConfig = {
        customConfig : '' // do not load config.js since it is empty
    };

    rf.ui.Editor = function(componentId, options, config) {
        $super.constructor.call(this, componentId);
        this.options = $.extend({}, defaultOptions, options);

        this.componentId = componentId;
        this.textareaId = componentId + ':inp';
        this.editorElementId = 'cke_' + this.textareaId;
        this.valueChanged = false;
        this.config = $.extend({}, defaultConfig, config);

        this.attachToDom(this.componentId);

        $(document).ready($.proxy(this.__initializationHandler, this));
        rf.Event.bindById(this.__getTextarea(), 'init', this.options.oninit, this);
    };

    rf.BaseComponent.extend(rf.ui.Editor);

    var $super = rf.ui.Editor.$super;

    $.extend(rf.ui.Editor.prototype, {

        name : "Editor",

        __initializationHandler : function() {
            this.ckeditor = CKEDITOR.replace(this.textareaId, this.__getConfiguration());

            // register event handlers
            rf.Event.bind(this.__getForm(), 'ajaxsubmit', $.proxy(this.__updateTextareaHandler, this));
            this.ckeditor.on('instanceReady', $.proxy(this.__instanceReadyHandler, this));
            this.ckeditor.on('blur', $.proxy(this.__blurHandler, this));
            this.ckeditor.on('focus', $.proxy(this.__focusHandler, this));
        },

        __updateTextareaHandler : function() {
            this.ckeditor.updateElement();
        },

        __instanceReadyHandler : function(e) {
            this.__setupStyling();
            this.__setupPassThroughAttributes();

            this.invokeEvent.call(this, "init", this.__getTextarea(), e);
        },

        __blurHandler : function(e) {
            this.invokeEvent.call(this, "blur", this.__getTextarea(), e);
            if (this.getEditor().checkDirty()) {
                this.valueChanged = true;
                this.__changeHandler();
            }
            this.getEditor().resetDirty();
        },

        __focusHandler : function(e) {
            this.invokeEvent.call(this, "focus", this.__getTextarea(), e);
        },

        __changeHandler : function(e) {
            this.invokeEvent.call(this, "change", this.__getTextarea(), e);
        },

        __getTextarea : function() {
            return $(document.getElementById(this.textareaId));
        },

        /**
         * Returns the form where this editor component is placed
         */
        __getForm : function() {
            return $('form').has(this.__getTextarea()).get(0);
        },

        __getConfiguration : function() {
            var textarea = this.__getTextarea();
            return $.extend({
                skin : this.options.skin,
                toolbar : this.__getToolbar(),
                readOnly : textarea.attr('readonly') || this.options.readonly,
                width : this.__resolveUnits(this.options.width),
                height : this.__resolveUnits(this.options.height),
                bodyClass : 'rf-ed-b',
                defaultLanguage : this.options.lang,
                contentsLanguage : this.options.lang
            }, this.config);
        },

        __setupStyling : function() {
            var span = $(document.getElementById(this.editorElementId));
            if (!span.hasClass('rf-ed')) {
                span.addClass('rf-ed');
            }
            var styleClass = $.trim(this.options.styleClass + ' ' + this.options.editorClass);
            if (this.initialStyle == undefined) {
                this.initialStyle = span.attr('style');
            }
            var style = this.__concatStyles(this.initialStyle, this.options.style, this.options.editorStyle);
            if (this.oldStyleClass !== styleClass) {
                if (this.oldStyleClass) {
                    span.removeClass(this.oldStyleClass);
                }
                span.addClass(styleClass);
                this.oldStyleClass = styleClass;
            }
            if (this.oldStyle !== style) {
                span.attr('style', style);
                this.oldStyle = style;
            }
        },

        __setupPassThroughAttributes : function() {
            var textarea = this.__getTextarea();
            var span = $(document.getElementById(this.editorElementId));

            // title
            span.attr('title', textarea.attr('title'));
        },

        __concatStyles : function() {
            var result = "";
            for ( var i = 0; i < arguments.length; i++) {
                var style = $.trim(arguments[i]);
                if (style) {
                    result = result + style + "; ";
                }
            }
            return result;
        },

        __getToolbar : function() {
            var toolbar = this.options.toolbar;

            var lowercase = toolbar.toLowerCase();
            if (lowercase === 'basic') {
                return 'Basic';
            }
            if (lowercase === 'full') {
                return 'Full';
            }

            return toolbar;
        },

        __setOptions : function(options) {
            this.options = $.extend({}, defaultOptions, options);
        },

        __resolveUnits : function(dimension) {
            var dimension = $.trim(dimension);
            if (dimension.match(/^[0-9]+$/)) {
                return dimension + 'px';
            } else {
                return dimension;
            }
        },

        getEditor : function() {
            return this.ckeditor;
        },

        setValue : function(newValue) {
            this.ckeditor.setData(newValue, $.proxy(function() {
                this.valueChanged = false;
                this.ckeditor.resetDirty();
            }, this));
        },

        getValue : function() {
            return this.ckeditor.getData();
        },

        getInput : function() {
            return document.getElementById(this.textareaId);
        },

        focus : function() {
            this.ckeditor.focus();
        },

        blur : function() {
            this.ckeditor.focusManager.forceBlur();
        },

        isFocused : function() {
            return this.ckeditor.focusManager.hasFocus;
        },

        isDirty : function() {
            return this.ckeditor.checkDirty();
        },

        isValueChanged : function() {
            return this.valueChanged || this.ckeditor.checkDirty();
        },

        setReadOnly : function(readOnly) {
            this.ckeditor.setReadOnly(readOnly !== false);
        },

        isReadOnly : function() {
            return this.ckeditor.readOnly;
        },

        destroy : function() {
            rf.Event.unbind(this.__getForm(), 'ajaxsubmit', this.__updateTextareaHandler);

            if (this.ckeditor) {
                this.ckeditor.destroy();
                this.ckeditor = null;
            }

            this.__getTextarea().show();

            $super.destroy.call(this);
        }
    });
})(jQuery, RichFaces);