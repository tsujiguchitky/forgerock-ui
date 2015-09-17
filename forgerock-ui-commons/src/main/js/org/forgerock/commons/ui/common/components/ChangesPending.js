/**
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER.
 *
 * Copyright (c) 2015 ForgeRock AS. All rights reserved.
 *
 * The contents of this file are subject to the terms
 * of the Common Development and Distribution License
 * (the License). You may not use this file except in
 * compliance with the License.
 *
 * You can obtain a copy of the License at
 * http://forgerock.org/license/CDDLv1.0.html
 * See the License for the specific language governing
 * permission and limitations under the License.
 *
 * When distributing Covered Code, include this CDDL
 * Header Notice in each file and include the License file
 * at http://forgerock.org/license/CDDLv1.0.html
 * If applicable, add the following below the CDDL Header,
 * with the fields enclosed by brackets [] replaced by
 * your own identifying information:
 * "Portions Copyrighted [year] [name of copyright owner]"
 */

/*global define */

define("org/forgerock/commons/ui/common/components/ChangesPending", [
    "jquery",
    "underscore",
    "org/forgerock/commons/ui/common/main/AbstractView"

], function ($, _, AbstractView) {

    var changesPendingInstance = {},
        ChangesPendingWidget = AbstractView.extend({
            template: "templates/common/ChangesPendingTemplate.html",
            noBaseTemplate: true,
            events: {
                "click .undo-changes": "undo"
            },

            /**
             * @param {object} args
             * @param {function} [callback] - Called after render
             */
            render: function (args, callback) {
                var defaults = {
                    alertClass: "alert-warning",
                    icon: "fa-exclamation-circle",
                    title: $.t("templates.user.ChangesPendingTemplate.changesPending"),
                    message: "",
                    undo: false,
                    undoMsg: $.t("templates.user.ChangesPendingTemplate.undo"),
                    watchedObj: {},
                    changes: null,
                    watchedProperties: [],
                    undoCallback: _.noop
                };

                this.data = _.extend(defaults, _.clone(args, true));
                this.element = args.element;

                if (!this.data.changes) {
                    this.data.changes = _.clone(this.data.watchedObj, true);
                }

                this.parentRender(_.bind(function () {
                    this.checkChanges();

                    if (callback) {
                        callback();
                    }
                }, this));
            },

            /**
             * We need this clean up for when a view is rerendered and the original element
             * is no longer present. This will set a new element and redeclare all associated events.
             *
             * @param {object} [el] - jQuery element to render widget to
             */
            reRender: function (el) {
                this.$el = el;
                this.data.element = el;
                this.render(this.data, _.noop);
                this.delegateEvents();
            },

            /**
             * When undo is clicked the changes object will be overwritten and the undo callback called.
             *
             * @param {object} e
             */
            undo: function (e) {
                e.preventDefault();
                this.data.changes = _.clone(this.data.watchedObj, true);
                if (this.data.undoCallback) {
                    this.data.undoCallback(_.pick(_.clone(this.data.watchedObj, true), this.data.watchedProperties));
                }
            },

            /**
             * Call to update widget with new data that has yet to be saved.
             *
             * @param {object} changes - The object that contains changes from the base object this.data.watchedObj
             */
            makeChanges: function (changes) {
                this.data.changes = _.clone(changes, true);
                this.checkChanges();
            },

            /**
             * Call to save your changes over to the watchedObj.
             */
            saveChanges: function () {
                this.data.watchedObj = _.clone(this.data.changes, true);
                this.checkChanges();
            },

            /**
             * Called when a change is made to this.data.changes or this.data.watchedObj
             */
            checkChanges: function () {
                var isChanged =  _.some(this.data.watchedProperties, function (prop) {

                    // Numbers and booleans are considered "empty" so we explicitly check for their type
                    if (_.isEmpty(this.data.changes[prop]) &&
                        !_.isNumber(this.data.changes[prop]) &&
                        !_.isBoolean(this.data.changes[prop])) {

                        delete this.data.changes[prop];
                    }

                    if (!this.compareObjects(prop, this.data.watchedObj, this.data.changes)) {
                        return true;
                    }

                }, this);

                $(this.element).toggle(isChanged);
            },

            /**
             * Compares two objects for equality on a given property.
             *
             * @param {string} property
             * @param {object} obj1
             * @param {object} obj2
             * @returns {*}
             */
            compareObjects: function(property, obj1, obj2) {
                function compare(val1, val2) {
                    _.each(val1, function(property, key) {
                        if (_.isEmpty(property) && !_.isNumber(property) && !_.isBoolean(property)) {
                            delete val1[key];
                        }
                    });

                    _.each(val2, function(property, key) {
                        if (_.isEmpty(property) && !_.isNumber(property) && !_.isBoolean(property)) {
                            delete val2[key];
                        }
                    });

                    return _.isEqual(val1, val2);
                }

                return compare(obj1[property], obj2[property]);
            }
        });

    /**
     * @param {object} args
     * @param {object} args.element - the jQuery element to render the widget to
     * @param {object} args.watchedObj - the object containing properties to watch for changes
     * @param {array} args.watchedProperties - a list of property names to watch for changes
     * @param {boolean} [args.undo=false] - enables the undo functionality
     * @param {string} [args.undoMsg="Undo Changes"] - the text on the undo link
     * @param {string} [args.undoCallback] - The function called when the undo link is clicked
     * @param {string} [args.title="Changes Pending"] - bolded title of the widget
     * @param {string} [args.message=""] - additional message
     * @param {string} [args.icon="fa-exclamation-circle"] - font awesome icon classname
     * @param {string} [args.alertClass="alert-warning"] - the classname to apply to the whole widget
     * @param {object} [args.changes] - contains the changes from watchedObj, this is usually not set manually
     * @param {object} [callback] - called after render
     * @returns {object} - An instance of the changes pending widget
     */
    changesPendingInstance.watchChanges = function (args, callback) {
        var widget = new ChangesPendingWidget();
        widget.render(args, callback);
        return widget;
    };

    return changesPendingInstance;
});