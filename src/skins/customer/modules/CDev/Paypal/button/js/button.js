/* vim: set ts=2 sw=2 sts=2 et: */

/**
 * Paypal In-Context checkout
 *
 * Copyright (c) 2011-present Qualiteam software Ltd. All rights reserved.
 * See https://www.x-cart.com/license-agreement.html for license details.
 */

var getInitiateTokenUrl = function (additionalParams) {
  var postOptions = {
    target: 'checkout',
    action: 'startExpressCheckout',
    inContext: true,
    PayPalAJAX: true
  };
  postOptions[xliteConfig.form_id_name] = xliteConfig.form_id;
  return URLHandler.buildURL($.extend(true, {}, postOptions, additionalParams || {}));
};

var getPPEnviroment = function () {
  var env = null;

  return function () {
    if (null === env) {
      env = core.getCommentedData(jQuery('body'), 'PayPalEnvironment');
    }

    return env;
  };
}();

var paypalAdd2CartAwaiting = false;

define('paypal_ec_button_processors', function () {
  var Processors = [];
  Processors.push(function (element, state) {
    if (element.is('.pp-style-buynow')) {
      state.label = 'buynow';
    } else if (element.is('.pp-style-pay')) {
      state.label = 'pay';
    }

    state.payment = function () {
      return paypal.request.post(getInitiateTokenUrl(state.additionalUrlParams)).then(function (data) {
        return data.token;
      });
    };
  });

  return Processors;
});

jQuery(function () {
  window.paypalCheckoutReady = function () {
    core.bind('renderPPButtons', function () {
      setTimeout(function () {
        $('.pp-express-checkout-button').each(function () {
          var elem = $(this);
          if ($.trim(elem.html()) === '') {
            define('paypal_ec_button_processing', ['paypal_ec_button_processors'], function (Processors) {
              var state = {
                label: 'checkout',
                fundingicons: false,
                color: 'gold',
                additionalUrlParams: {},
                size: 'responsive',
                funding: {},
                tagline: true
              };

              Processors.forEach(function (callback) {
                callback(elem, state);
              });

              var style = {
                size: state.size,
                shape: state.shape || 'rect',
                label: state.label,
                branding: true,
                tagline: state.tagline
              };

              if (state.color) {
                style.color = state.color;
              }

              if (state.fundingicons) {
                style.fundingicons = state.fundingicons;
              }

              var buttonObject = {

                'env': getPPEnviroment(),

                'style': style,

                'payment': state.payment,

                'funding': state.funding,

                'onAuthorize': function (data, actions) {
                  paypalAdd2CartAwaiting = false;
                  return actions.redirect();
                },

                'onCancel': function (data, actions) {
                  paypalAdd2CartAwaiting = false;
                  return actions.redirect();
                },

                'onError': function (err) {
                  paypalAdd2CartAwaiting = false;
                }

              };

              if (elem.data('locale')) {
                buttonObject.locale = elem.data('locale');
              }

              paypal.Button.render(buttonObject, elem.get(0));
            });
          }
        });
      }, 500);
    });
    core.trigger('renderPPButtons');
  };
});

core.bind([
  'load',
  'loader.loaded',
  'afterPopupPlace',
  'checkout.main.ready',
  'product.details.quantityBox.initialize',
], function () {
  core.trigger('renderPPButtons');
});

core.bind('resources.ready', _.once(function () {
  core.trigger('renderPPButtons');
}));

jQuery(function () {
  decorate(
    'ProductDetailsView',
    'postprocessAdd2Cart',
    function (event, data) {
      if (!paypalAdd2CartAwaiting) {
        arguments.callee.previousMethod.apply(this, arguments);
      }

      core.trigger('activateExpressCheckout');
    }
  );
});