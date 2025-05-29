// Show price settings menu element
const showPriceSettings = document.getElementById('show-price-settings');
const hidePriceSettings = document.getElementById('hide-price-settings');

if (showPriceSettings) {
    showPriceSettings.addEventListener('click', togglePriceSettings);
}
if (hidePriceSettings) {
    hidePriceSettings.addEventListener('click', togglePriceSettings);
}

function togglePriceSettings() {
    var priceSettingsEl = $('#price-settings');

    priceSettingsEl.toggleClass('show-price-settings');
}

function applyPriceSettings() {
    var priceEl = $('.pricing');
    var getToggleStatus = $('.price-toggle input:checked').val();
    var getMultiplier = $('#price-multiplier').val();
    
    priceEl.each(function(index) {
        if (getToggleStatus == 'Off') {
            $(this).addClass('hide-pricing');
            $(this).parents('.carton-pricing').addClass('hide-pricing');
            $(this).parents('.subtotal').addClass('hide-pricing');
            $(this).parents('.cart-bar-total').addClass('hide-pricing');
            $('#shopping-cart .product-info--pre-order').hide();
            $('#cartform .carton-item-price').hide();
            $('#cartform .item-price').hide();
            $('#cartform .total-price').hide();
            $(this).parents('#shopping-cart .cart-price').addClass('hide-pricing');
            $(this).parents('#shopping-cart .cart-total').addClass('hide-pricing');
            $(this).parents('#shopping-cart .cart-summary').addClass('hide-pricing');
            $('.price-type').addClass('hide-pricing');
            $('.m2m-from-price').addClass('hide-pricing');
            $('.m2m-calculated-price').addClass('hide-pricing');
            $('.price-item').addClass('hide-pricing');
            $('.ais-hit--price').addClass('hide-pricing');
            $('.cart-items .price-option').addClass('hide-pricing');
            $('.cart-items .cart-item__price-wrapper').addClass('hide-pricing');
            $('.cart__footer .totals').addClass('hide-pricing');
        } else {
            $(this).removeClass('hide-pricing');
            $(this).parents('.carton-pricing').removeClass('hide-pricing');
            $(this).parents('.subtotal').removeClass('hide-pricing');
            $(this).parents('.cart-bar-total').removeClass('hide-pricing');
            $('#shopping-cart .product-info--pre-order').show();
            $('#cartform .carton-item-price').show();
            $('#cartform .item-price').show();
            $('#cartform .total-price').show();
            $(this).parents('#shopping-cart .cart-price').removeClass('hide-pricing');
            $(this).parents('#shopping-cart .cart-total').removeClass('hide-pricing');
            $(this).parents('#shopping-cart .cart-summary').removeClass('hide-pricing');
            $('.price-type').removeClass('hide-pricing');
            $('.m2m-from-price').removeClass('hide-pricing');
            $('.m2m-calculated-price').removeClass('hide-pricing');
            $('.price-item').removeClass('hide-pricing');
            $('.ais-hit--price').removeClass('hide-pricing');
            $('.cart-items .price-option').removeClass('hide-pricing');
            $('.cart-items .cart-item__price-wrapper').removeClass('hide-pricing');
            $('.cart__footer .totals').removeClass('hide-pricing');
        }

        var variantPrice = $(this).attr('data-price');
        var variantPriceFormatted = '£' + (variantPrice / 100).toFixed(2);
        var multiplierPrice = variantPrice * getMultiplier;
        var multiplierPriceFormatted = '£' + (multiplierPrice / 100).toFixed(2);

        if (getMultiplier > 1) {
            $(this).text(multiplierPriceFormatted);
            $('.price-type').text('Retail Price (Inc. VAT)');
            var m2mPrice = $('.m2m-calculated-price').attr('data-price');
            var m2mMultiplierPrice = m2mPrice * getMultiplier;

            if(m2mPrice != '') {
                $('.m2m-calculated-price').text('£' + (m2mMultiplierPrice / 100).toFixed(2));
            }
        } else if (getMultiplier == 1) {
            $(this).text(variantPriceFormatted);
            $('.price-type').text('Trade Price (Ex. VAT)');
        }
    });
}

// Update price settings on save
const savePriceSettings = document.getElementById('save-price-settings');

if (savePriceSettings) {
    savePriceSettings.addEventListener('click', function(){
        savePriceSettings.setAttribute('value', 'Please wait...');
        applyPriceSettings();
        setTimeout(function(){window.location.reload()}, 2000);
    });
}

// Apply price settings to collections
window.addEventListener('load', (event) => {
    applyPriceSettings();
});

// Reset price settings
function clearPriceSettings() {
    const priceToggle = $('.price-toggle input[value="On"');
    const priceMultiplier = $('#price-multiplier');

    priceToggle.prop('checked', true);
    priceMultiplier.val(1);
    applyPriceSettings();
}

const resetPriceSettings = document.getElementById('reset-price-settings');

if (resetPriceSettings) {
    resetPriceSettings.addEventListener('click', clearPriceSettings);
}