/* vim: set ts=2 sw=2 sts=2 et: */

/**
 * Product details controller
 *
 * Copyright (c) 2011-present Qualiteam software Ltd. All rights reserved.
 * See https://www.x-cart.com/license-agreement.html for license details.
 */

var old_postprocess = ProductDetailsView.prototype.postprocess;
ProductDetailsView.prototype.postprocess = function(isSuccess, initial) {
  old_postprocess.apply(this, arguments);

  if (isSuccess) {
    var initialURL = document.location.toString().split('#')[0];
    $('.product-tabs-brief-info li a').click(
      _.bind(
        function (event) {
          event.preventDefault();

          var link = jQuery($('.product-details .product-details-tabs a[data-id="' + $(event.currentTarget).data('id') + '"]'));
          this.openTab(link);

          if (history.pushState) {
            history.pushState(null, null, initialURL + '#' + link.data('id'));

          } else {
            self.location.hash = link.data('id');
          }

          $('html, body').animate({
            scrollTop: $('.product-details .product-details-tabs').offset().top - 100
          }, 800, 'easeInOutCubic').on('mousewheel', function () {
            $(this).stop();
          });
        },
        this
      )
    );
  }
};