// Made to Measure functions
function m2mFetchData(event) {
    if(Shopify.theme.role == 'main')
        var url = 'https://m2m.rivahome.com/furn-m2m-prices.php';
    else
        var url = 'https://staging.m2m.rivahome.com/furn-m2m-prices.php';
    
    var form = $(event.target).parents('.m2mCalculatePriceForm');
    var formData = form.serializeArray();
    var unitType = $('.m2mUnits', form).val();

    // Check if unit type is inches
    if (unitType == 'in') {
        let size = convertInchesToCm(form);

        var width = size.widthCm,
            drop = size.dropCm;
    
        // Loop through form data and update width and drop values
        for (let i = formData.length - 1; i >= 0; i--) {
            const item = formData[i];
    
            if (item.name == 'width') {
                item.value = width;
            }
    
            if (item.name == 'drop') {
                item.value = drop;
            }
        };
    }

    var settings = {
        method: 'GET',
        url: url,
        data: formData,
    };

    $.ajax(settings).done(function (response) {
        var types = response.types;
        var eyelets = response.eyelets;
        var linings = response.linings;
        var prices = response.prices;
        var fixings = [{name: 'Left', frontend_name: 'Left'}, {name: 'Right', frontend_name: 'Right'}];
        var fittings = [{name: 'Exact', frontend_name: 'Exact'}, {name: 'Recess', frontend_name: 'Recess'}];
        var cushions = response.options.cushions;
        var tiebacks = response.options.tiebacks;
        var additionalPrices = [cushions, tiebacks];

        if($('.m2mCalculatePrice.button', form).attr('include-types')) {
            types = $('.m2mCalculatePrice.button', form).attr('include-types').split(",");
        } else {
            var newTypes = [];
            newTypes.push('Roman Blinds');
            types = newTypes;
        }

        if($('.m2mCalculatePrice.button', form).attr('include-linings'))
        {
            var liningsInclude = $('.m2mCalculatePrice.button', form).attr('include-linings').split(",");
            var newLinings = [];
            $(linings).each(function(){
                if(liningsInclude.includes(this.frontend_name))
                    newLinings.push(this);
            });
            linings = newLinings;
        }

        m2mBuildDropdowns(types, eyelets, linings, fixings, fittings, cushions, tiebacks);
        m2mUpdateForm(prices, additionalPrices, form);
    });
}

// 1inch = 2.54cm
var conversionFactor = 2.54;

function m2mSwitchUnitOfMeasurement(event) {
    var form;
    var parents = $(event.target).parents();
    if (parents.hasClass('m2m-tabs')) {
        var form = $(event.target).parents('.m2m-tab');
    }

    var unitType = $('.m2mUnits', form).val();
    var widthInput = $('.m2mWidth', form);
    var dropInput = $('.m2mDrop', form);
    var minMaxMeta = $('.m2m-min-max', form);

    // Clear width & drop inputs
    m2mResetForm('full');

    // Get min max values from inputs
    var minWidth = minMaxMeta.attr('data-min-width');
    var maxWidth = minMaxMeta.attr('data-max-width');
    var minDrop = minMaxMeta.attr('data-min-drop');
    var maxDrop = minMaxMeta.attr('data-max-drop');

    // Get info min / max spans
    var infoMinWidth = $('.m2mMinWidth');
    var infoMaxWidth = $('.m2mMaxWidth');
    var infoMinDrop = $('.m2mMinDrop');
    var infoMaxDrop = $('.m2mMaxDrop');

    // Check if unit type is inches
    if (unitType == 'in') {
        var minWidthInches = Math.ceil(minWidth / conversionFactor);
        var maxWidthInches = Math.floor(maxWidth / conversionFactor);
        var minDropInches = Math.ceil(minDrop / conversionFactor);
        var maxDropInches = Math.floor(maxDrop / conversionFactor);

        // Update size info box
        infoMinWidth.html(minWidthInches + 'in');
        infoMaxWidth.html(maxWidthInches + 'in');
        infoMinDrop.html(minDropInches + 'in');
        infoMaxDrop.html(maxDropInches + 'in');

        // Update input min / max values
        widthInput.attr('min', minWidthInches);
        widthInput.attr('max', maxWidthInches);
        dropInput.attr('min', minDropInches);
        dropInput.attr('max', maxDropInches);
    } else if (unitType == 'cm') {
        // Update size info box
        infoMinWidth.html(minWidth + 'cm');
        infoMaxWidth.html(maxWidth + 'cm');
        infoMinDrop.html(minDrop + 'cm');
        infoMaxDrop.html(maxDrop + 'cm');

        // Update input min / max values
        widthInput.attr('min', minWidth);
        widthInput.attr('max', maxWidth);
        dropInput.attr('min', minDrop);
        dropInput.attr('max', maxDrop);
    }
}

function convertInchesToCm(form) {
    var widthInches = $('.m2mWidth', form).val();
    var dropInches = $('.m2mDrop', form).val();

    // Convert inches to cm
    var widthCm = widthInches * conversionFactor;
    var dropCm = dropInches * conversionFactor;
    
    return {
        widthCm,
        dropCm
    };
}

function convertCmToInches(form) {
    var widthCm = $('.m2mWidth', form).val();
    var dropCm = $('.m2mDrop', form).val();

    // Convert cm to inches
    var widthInches = widthCm / conversionFactor;
    var dropInches = dropCm / conversionFactor;

    return {
        widthInches,
        dropInches
    };
}

function m2mResetForm(resetType) {
    var widthInput = $('.m2mWidth');
    var dropInput = $('.m2mDrop');
    var fromPriceEl = $('.m2m-from-price');
    var calculatedPriceEl = $('.m2m-calculated-price');

    if (resetType == 'full') {
        widthInput.val('');
        dropInput.val('');
    }

    calculatedPriceEl.hide();
    fromPriceEl.show();
    $('.m2m-add-to-cart').removeClass('visible');
    m2mClearDropdowns();
}

function m2mBuildDropdowns(types, eyelets, linings, fixings, fittings, cushions, tiebacks) {
    var addToCartForm = $('.m2mAddToCartForm');
    var dropdownAttr = addToCartForm.attr('data-dropdowns');
    var defaultAsset = 'https://cdn.shopify.com/s/files/1/0512/8690/0935/t/69/assets/m2m-icon-default.jpg';
    var assetObject = JSON.parse(document.getElementById('m2m-asset-json').textContent);

    if (dropdownAttr == 'false') {
        var headingDropdown = $('.m2mHeading');
        var headingIllustrated = $('.m2mHeadingIllustrated');
        for (var type in types) {
            // Create heading type dropdown option & append to select element
            var option = document.createElement('option');
            option.innerHTML = types[type];
            option.value = types[type];
            headingDropdown.append(option);

            // Create image wrapper elements
            var divOuter = document.createElement('div');
            var divInner = document.createElement('div');

            divOuter.setAttribute('class', 'illustrated-item item-large');

            if (type == 0) {
                divInner.setAttribute('class', 'illustration-wrapper selected');
            } else {
                divInner.setAttribute('class', 'illustration-wrapper');
            }

            headingIllustrated.append(divOuter);
            divOuter.append(divInner);

            // Create image element & append to inner wrapper
            var img = document.createElement('img');
            var typeName = types[type].toLowerCase().replace(new RegExp('[ /]', 'g'), '-');
            var imgFilename = defaultAsset;

            for (let image of assetObject.heading_images) {
                if (image.img_src.includes('m2m-icon-' + typeName + '.')) {
                    var imgFilename = image.img_src;
                }
            }

            img.setAttribute('class', 'illustration');
            img.setAttribute('src', imgFilename);
            img.setAttribute('data-value', types[type]);
            divInner.append(img);

            // Create label & append to outer wrapper
            var label = document.createElement('label');
            divOuter.append(label);
            label.append(types[type]);
        }
        
        var eyeletDropdown = $('.m2mEyelets');
        var eyeletIllustrated = $('.m2mEyeletsIllustrated');
        for (var eyelet in eyelets) {
            // Create eylet dropdown option & append to select element
            var name = eyelets[eyelet[0]]['name'];
            var frontendName = eyelets[eyelet[0]]['frontend_name'];
            var option = document.createElement('option');
            option.innerHTML = name;
            option.value = name;
            option.setAttribute('data-frontend-name', frontendName);
            eyeletDropdown.append(option);

            // Create image wrapper elements
            var divOuter = document.createElement('div');
            var divInner = document.createElement('div');

            divOuter.setAttribute('class', 'illustrated-item');

            if (eyelet == 0) {
                divInner.setAttribute('class', 'illustration-wrapper selected');
            } else {
                divInner.setAttribute('class', 'illustration-wrapper');
            }

            eyeletIllustrated.append(divOuter);
            divOuter.append(divInner);

            // Create image element & append to inner wrapper
            var img = document.createElement('img');
            var eyeletName = name.toLowerCase().replace(new RegExp('[ /]', 'g'), '-');
            var imgFilename = defaultAsset;

            for (let image of assetObject.eyelet_images) {
                if (image.img_src.includes('m2m-icon-' + eyeletName + '.')) {
                    var imgFilename = image.img_src;
                }
            }

            img.setAttribute('class', 'illustration');
            img.setAttribute('src', imgFilename);
            img.setAttribute('data-value', name);
            divInner.append(img);

            // Create label & append to outer wrapper
            var label = document.createElement('label');
            divOuter.append(label);
            label.append(frontendName);
        }

        // Reverse fixings so right is default
        fixings.reverse();

        var fixingsDropdown = $('#m2mFixings');
        var fixingsIllustrated = $('#m2mFixingsIllustrated');
        for (var fixing in fixings) {
            // Create fittings dropdown option & append to select element
            var name = fixings[fixing[0]]['name'];
            var frontendName = fixings[fixing[0]]['frontend_name'];
            var option = document.createElement('option');
            option.innerHTML = name;
            option.value = name;
            option.setAttribute('data-frontend-name', frontendName);
            fixingsDropdown.append(option);

            // Create image wrapper elements
            var divOuter = document.createElement('div');
            var divInner = document.createElement('div');

            divOuter.setAttribute('class', 'radio-item');

            if (fixing == 0) {
                divInner.setAttribute('class', 'radio-wrapper selected');
            } else {
                divInner.setAttribute('class', 'radio-wrapper');
            }

            fixingsIllustrated.append(divOuter);
            divOuter.append(divInner);

            // Create css radio button instead of image
            var radioBtn = document.createElement('span');
            radioBtn.setAttribute('class', 'radio-btn');
            radioBtn.setAttribute('data-value', name);
            divInner.append(radioBtn);

            // Create label & append to outer wrapper
            var label = document.createElement('label');
            divOuter.append(label);
            label.append(frontendName);
        }        

        var fittingsDropdown = $('#m2mFittings');
        var fittingsIllustrated = $('#m2mFittingsIllustrated');
        for (var fitting in fittings) {
            // Create fittings dropdown option & append to select element
            var name = fittings[fitting[0]]['name'];
            var frontendName = fittings[fitting[0]]['frontend_name'];
            var option = document.createElement('option');
            option.innerHTML = name;
            option.value = name;
            option.setAttribute('data-frontend-name', frontendName);
            fittingsDropdown.append(option);

            // Create image wrapper elements
            var divOuter = document.createElement('div');
            var divInner = document.createElement('div');

            divOuter.setAttribute('class', 'illustrated-item');

            if (fitting == 0) {
                divInner.setAttribute('class', 'illustration-wrapper selected');
            } else {
                divInner.setAttribute('class', 'illustration-wrapper');
            }

            fittingsIllustrated.append(divOuter);
            divOuter.append(divInner);

            // Create image element & append to inner wrapper
            var img = document.createElement('img');
            var fittingName = name.toLowerCase().replace(new RegExp('[ /]', 'g'), '-');
            var imgFilename = defaultAsset;

            for (let image of assetObject.fitting_images) {
                if (image.img_src.includes('m2m-icon-' + fittingName + '.')) {
                    var imgFilename = image.img_src;
                }
            }

            img.setAttribute('class', 'illustration');
            img.setAttribute('src', imgFilename);
            img.setAttribute('data-value', name);
            divInner.append(img);

            // Create label & append to outer wrapper
            var label = document.createElement('label');
            divOuter.append(label);
            label.append(frontendName);
        }

        var liningDropdown = $('.m2mLining');
        var liningIllustrated = $('.m2mLiningIllustrated');
        for (var lining in linings) {
            // Create lining dropdown option & append to select element
            var name = linings[lining[0]]['name'];
            var frontendName = linings[lining[0]]['frontend_name'];
            var option = document.createElement('option');
            option.innerHTML = name;
            option.value = name;
            option.setAttribute('data-frontend-name', frontendName);
            liningDropdown.append(option);

            // Create image wrapper elements
            var divOuter = document.createElement('div');
            var divInner = document.createElement('div');

            divOuter.setAttribute('class', 'illustrated-item');

            if (lining == 0) {
                divInner.setAttribute('class', 'illustration-wrapper selected');
            } else {
                divInner.setAttribute('class', 'illustration-wrapper');
            }

            liningIllustrated.append(divOuter);
            divOuter.append(divInner);

            // Create image element & append to inner wrapper
            var img = document.createElement('img');
            var liningName = name.toLowerCase().replace(new RegExp('[ /]', 'g'), '-');
            var imgFilename = defaultAsset;

            for (let image of assetObject.lining_images) {
                if (image.img_src.includes('m2m-icon-' + liningName + '.')) {
                    var imgFilename = image.img_src;
                }
            }

            img.setAttribute('class', 'illustration');
            img.setAttribute('src', imgFilename);
            img.setAttribute('data-value', name);
            divInner.append(img);

            // Create label & append to outer wrapper
            var label = document.createElement('label');
            divOuter.append(label);
            label.append(frontendName);
        }

        var cushionDropdown = $('.m2mCushions');
        for (var cushion in cushions) {
            // Create cushion dropdown option & append to select element
            var name = cushions[cushion[0]]['name'];
            var fill = cushions[cushion[0]]['fill'];
            var price = " (+£" + cushions[cushion[0]]['price'] + ")";
            var frontendName = name + ' - ' + fill;

            var option = document.createElement('option');
            option.innerHTML = frontendName + price;
            option.value = frontendName;
            cushionDropdown.append(option);
        }

        var tiebackDropdown = $('.m2mTiebacks');
        for (var tieback in tiebacks) {
            // Create tieback dropdown option & append to select element
            var name = tiebacks[tieback[0]]['name'];
            var price = " (+£" + tiebacks[tieback[0]]['price'] + ")";
            var frontendName = tiebacks[tieback[0]]['frontend_name'];

            var option = document.createElement('option');
            option.innerHTML = name + price;
            option.value = name;
            option.setAttribute('data-frontend-name', frontendName);
            tiebackDropdown.append(option);
        }

        addToCartForm.attr('data-dropdowns', 'true');
    }
}

function m2mClearDropdowns() {
    var addToCartForm = $('.m2mAddToCartForm');
    var headingDropdown = $('.m2mHeading');
    var headingIllustrated = $('.m2mHeadingIllustrated');
    var eyeletDropdown = $('.m2mEyelets');
    var eyeletIllustrated = $('.m2mEyeletsIllustrated');
    var liningDropdown = $('.m2mLining');
    var liningIllustrated = $('.m2mLiningIllustrated');
    var fixingsDropdown = $('#m2mFixings');
    var fixingsIllustrated = $('#m2mFixingsIllustrated');
    var fittingsDropdown = $('#m2mFittings');
    var fittingsIllustrated = $('#m2mFittingsIllustrated');
    var cushionsDropdown = $('.m2mCushions');
    var tiebacksDropdown = $('.m2mTiebacks');

    headingDropdown.empty();
    headingIllustrated.empty();
    eyeletDropdown.empty();
    eyeletIllustrated.empty();
    liningDropdown.empty();
    liningIllustrated.empty();
    fixingsDropdown.empty();
    fixingsIllustrated.empty();
    fittingsDropdown.empty();
    fittingsIllustrated.empty();
    cushionsDropdown.empty().attr('data-option','no').attr('data-option-selected','no');
    tiebacksDropdown.empty().attr('data-option','no').attr('data-option-selected','no');
    cushionsDropdown.parent('.curtain-options--dropdown').removeClass('visible');
    tiebacksDropdown.parent('.curtain-options--dropdown').removeClass('visible');
    cushionsDropdown.parent('.curtain-options--dropdown').siblings('.curtain-option--description').removeClass('visible');
    tiebacksDropdown.parent('.curtain-options--dropdown').siblings('.curtain-option--description').removeClass('visible');
    cushionsDropdown.parent().siblings('.curtain-options--radio-buttons').find('.radio-wrapper').removeClass('selected');
    tiebacksDropdown.parent().siblings('.curtain-options--radio-buttons').find('.radio-wrapper').removeClass('selected');
    cushionsDropdown.parents('.curtain-option-wrapper').removeClass('error');
    cushionsDropdown.parent().siblings('.curtain-option--error').removeClass('visible');
    tiebacksDropdown.parents('.curtain-option-wrapper').removeClass('error');
    tiebacksDropdown.parent().siblings('.curtain-option--error').removeClass('visible');
    $('.curtain-option-wrapper').removeClass('active');
    addToCartForm.attr('data-dropdowns', 'false');
}

// On image click, change selected class & dropdown value
$('.m2m-form-wrapper').on('click', '.illustration, .radio-btn', function(){
    // Change illustration selected
    $(this).parents('.curtain-options--illustrated').children().find('.illustration-wrapper').removeClass('selected');
    $(this).parents('.curtain-options--illustrated').children().find('.radio-wrapper').removeClass('selected');
    $(this).parents('.curtain-options--radio-buttons').children().find('.radio-wrapper').removeClass('selected');
    $(this).parent().addClass('selected');
    // Change section selected
    $(this).parents('.m2mAddToCartForm').children('.curtain-option-wrapper').removeClass('active');
    $(this).parents('.curtain-option-wrapper').addClass('active');
    // Switch visible curtain description to active section
    $('.curtain-option--description').removeClass('visible');
    $(this).parents('.curtain-option-wrapper').find('.curtain-option--description').addClass('visible');
    // Update form dropdown to match selected image
    var dropdown = $(this).closest('.curtain-option-wrapper').find('select');
    var dataValue = $(this).attr('data-value');
    // Ignore dropdowns for Cushions & Tiebacks
    if (!dropdown.is('.m2mCushions, .m2mTiebacks')) {
        dropdown.val(dataValue).change();
    }
    // Toggle Cushion / Tieback dropdowns and update Yes / No data attr
    if ($(this).hasClass('radio-btn')) {
        if ($(this).attr('data-value') == 'Yes') {
            $(this).parents('.curtain-options--radio-buttons').siblings('.curtain-options--dropdown').addClass('visible').find('select').attr('data-option','yes');
        } else {
            $(this).parents('.curtain-options--radio-buttons').siblings('.curtain-options--dropdown').removeClass('visible').find('select').attr('data-option','no');
        }
    }
});

// On select click, change selected class & dropdown value
$('.m2m-form-wrapper').on('click', 'select', function(){
    // Change section selected
    $(this).parents('#m2mAddToCartForm').children('.curtain-option-wrapper').removeClass('active');
    $(this).parents('.curtain-option-wrapper').addClass('active');
    // Switch visible curtain description to active section
    $('.curtain-option--description').removeClass('visible');
    $(this).parents('.curtain-option-wrapper').find('.curtain-option--description').addClass('visible');
});

// Made to measure width & drop error validation
var widthError = false;
var dropError = false;

function m2mValidateWidthDrop(event) {
    var minValue = parseInt(event.target.min);
    var maxValue = parseInt(event.target.max);
    var inputValue = $(event.target).val();
    var input = event.target.name;

    if (inputValue < minValue || inputValue > maxValue) {
        $(event.target).addClass('validation-error');

        if (input == 'width') {
            widthError = true;
        } else if (input == 'drop') {
            dropError = true;
        }

        if (widthError == true || dropError == true) {
            $('.size-info').addClass('validation-error');
            $('.size-info-icon').html('<i class="fa fa-exclamation-triangle"></i>');
            m2mResetForm('partial');
        }
    } else {
        $(event.target).removeClass('validation-error');

        if (input == 'width') {
            widthError = false;
        } else if (input == 'drop') {
            dropError = false;
        }

        if (widthError == false && dropError == false) {
            $('.size-info').removeClass('validation-error');
            $('.size-info-icon').html('<i class="fa fa-info-circle"></i>');
        }
    }

    if (widthError == false && dropError == false) {
        m2mFetchData(event);
    }
}

function m2mValidateCushionsTiebacks(event, productType) {
    if ($(event.target).is('#m2mAddToCart')) {
        var cushions = $('.m2mCushions');
        var tiebacks = $('.m2mTiebacks');
        var cushionsSelected = cushions.attr('data-option-selected');
        var tiebacksSelected = tiebacks.attr('data-option-selected');

        if (cushionsSelected == 'no') {
            event.preventDefault();
            cushions.parents('.curtain-option-wrapper').addClass('error');
            cushions.parent().siblings('.curtain-option--error').addClass('visible');
        } else {
            cushions.parents('.curtain-option-wrapper').removeClass('error');
            cushions.parent().siblings('.curtain-option--error').removeClass('visible');
        }

        if (tiebacksSelected == 'no') {
            event.preventDefault();
            tiebacks.parents('.curtain-option-wrapper').addClass('error');
            tiebacks.parent().siblings('.curtain-option--error').addClass('visible');
        } else {
            tiebacks.parents('.curtain-option-wrapper').removeClass('error');
            tiebacks.parent().siblings('.curtain-option--error').removeClass('visible');
        }
    } else {
        var itemSelected = $(event.target).attr('data-option-selected');

        if (itemSelected == 'no') {
            event.preventDefault();
            $(event.target).parents('.curtain-option-wrapper').addClass('error');
            $(event.target).parents('.curtain-options--radio-buttons').siblings('.curtain-option--error').addClass('visible');
        } else {
            $(event.target).parents('.curtain-option-wrapper').removeClass('error');
            $(event.target).parents('.curtain-options--radio-buttons').siblings('.curtain-option--error').removeClass('visible');
        }
    }

    if (productType == 'curtains') {
        if (cushionsSelected == 'yes' && tiebacksSelected == 'yes') {
            return true;
        }
    } else if (productType == 'blinds') {
        if (cushionsSelected == 'yes') {
            return true;
        }
    }
}

function m2mUpdateForm(prices, additionalPrices, form) {
    var headingDropdown = $('.m2mHeading');
    var headingIllustrated = $('.m2mHeadingIllustrated');
    var eyeletDropdown = $('.m2mEyelets');
    var eyeletsIllustrated = $('.m2mEyeletsIllustrated');
    var liningDropdown = $('.m2mLining');
    var liningIllustrated = $('.m2mLiningIllustrated');
    var fixingsDropdown = $('#m2mFixings');
    var fixingsIllustrated = $('#m2mFixingsIllustrated');
    var fittingsDropdown = $('#m2mFittings');
    var fittingsIllustrated = $('#m2mFittingsIllustrated');
    var cushionsDropdown = $('.m2mCushions');
    var tiebacksDropdown = $('.m2mTiebacks');
    var headingValue = $(headingDropdown).val();
    var eyeletValue = $(eyeletDropdown).val();
    var liningValue = $(liningDropdown).val();
    var fixingsValue = $(fixingsDropdown).val();
    var fittingsValue = $(fittingsDropdown).val();
    var includeCushions = $('.m2mCushions').attr('data-option');
    var includeTiebacks = $('.m2mTiebacks').attr('data-option');
    if (includeCushions == 'yes') {
        var cushionsValue = $(cushionsDropdown).val();
    }
    if (includeTiebacks == 'yes') {
        var tiebacksValue = $(tiebacksDropdown).val();
    }
    var selectedValues = {type: headingValue, eyelets: eyeletValue, lining: liningValue, fixings: fixingsValue, fittings: fittingsValue, cushions: cushionsValue, tiebacks: tiebacksValue};
    var finalPrice = m2mGetPrice(prices, additionalPrices, selectedValues);
    var fromPriceEl = $('.m2m-from-price');
    var calculatedPriceEl = $('.m2m-calculated-price');
    var productType = $('.m2mProductType', form).val();
    var getMultiplier = $('#price-multiplier').val();

    if (getMultiplier > 1) {
        var multiplierPrice = finalPrice * getMultiplier;
        $(calculatedPriceEl).show().text('£' + multiplierPrice.toFixed(2));
        $(calculatedPriceEl).attr('data-price', finalPrice * 100);
    } else {
        $(calculatedPriceEl).show().text('£' + finalPrice.toFixed(2));
    }

    $(fromPriceEl).hide();
    $('.m2m-add-to-cart').addClass('visible');

    if(productType == 'blinds') {
        headingIllustrated.parent().addClass('hidden');
        eyeletsIllustrated.parent().addClass('hidden');
        liningIllustrated.parents('.curtain-option-wrapper').addClass('active');
        liningIllustrated.siblings('.curtain-option--description').addClass('visible');
        tiebacksDropdown.parents('.curtain-option-wrapper').addClass('hidden');
    } else if (productType == 'curtains') {
        headingIllustrated.parents('.curtain-option-wrapper').addClass('active');
        headingIllustrated.siblings('.curtain-option--description').addClass('visible');
        fixingsIllustrated.parent().addClass('hidden');
        fittingsIllustrated.parent().addClass('hidden');
        liningIllustrated.siblings('.curtain-option--description').removeClass('visible');
        tiebacksDropdown.parents('.curtain-option-wrapper').removeClass('hidden');
    }

    $(headingDropdown).on('change', function() {
        selectedValues.type = this.value;

        if (this.value.includes('Eyelet')) {
            eyeletsIllustrated.parent().removeClass('hidden');
        } else {
            eyeletsIllustrated.parent().addClass('hidden');
        }

        finalPrice = m2mGetPrice(prices, additionalPrices, selectedValues);
        getMultiplier = $('#price-multiplier').val();

        if (getMultiplier > 1) {
            multiplierPrice = finalPrice * getMultiplier;
            $(calculatedPriceEl).text('£' + multiplierPrice.toFixed(2));
            $(calculatedPriceEl).attr('data-price', finalPrice * 100);
        } else {
            $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
        }
    });

    $(eyeletDropdown).on('change', function() {
        selectedValues.eyelets = this.value;
        finalPrice = m2mGetPrice(prices, additionalPrices, selectedValues);
        getMultiplier = $('#price-multiplier').val();

        if (getMultiplier > 1) {
            multiplierPrice = finalPrice * getMultiplier;
            $(calculatedPriceEl).text('£' + multiplierPrice.toFixed(2));
            $(calculatedPriceEl).attr('data-price', finalPrice * 100);
        } else {
            $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
        }
    });

    $(liningDropdown).on('change', function() {
        selectedValues.lining = this.value;
        finalPrice = m2mGetPrice(prices, additionalPrices, selectedValues);
        getMultiplier = $('#price-multiplier').val();

        if (getMultiplier > 1) {
            multiplierPrice = finalPrice * getMultiplier;
            $(calculatedPriceEl).text('£' + multiplierPrice.toFixed(2));
            $(calculatedPriceEl).attr('data-price', finalPrice * 100);
        } else {
            $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
        }
    });

    $(fixingsDropdown).on('change', function() {
        selectedValues.fixings = this.value;
        finalPrice = m2mGetPrice(prices, additionalPrices, selectedValues);
        getMultiplier = $('#price-multiplier').val();

        if (getMultiplier > 1) {
            multiplierPrice = finalPrice * getMultiplier;
            $(calculatedPriceEl).text('£' + multiplierPrice.toFixed(2));
            $(calculatedPriceEl).attr('data-price', finalPrice * 100);
        } else {
            $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
        }
    });

    $(fittingsDropdown).on('change', function() {
        selectedValues.fittings = this.value;
        finalPrice = m2mGetPrice(prices, additionalPrices, selectedValues);
        getMultiplier = $('#price-multiplier').val();

        if (getMultiplier > 1) {
            multiplierPrice = finalPrice * getMultiplier;
            $(calculatedPriceEl).text('£' + multiplierPrice.toFixed(2));
            $(calculatedPriceEl).attr('data-price', finalPrice * 100);
        } else {
            $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
        }
        $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
    });

    $(cushionsDropdown).on('change', function() {
        selectedValues.cushions = this.value;
        finalPrice = m2mGetPrice(prices, additionalPrices, selectedValues);
        getMultiplier = $('#price-multiplier').val();

        if (getMultiplier > 1) {
            multiplierPrice = finalPrice * getMultiplier;
            $(calculatedPriceEl).text('£' + multiplierPrice.toFixed(2));
            $(calculatedPriceEl).attr('data-price', finalPrice * 100);
        } else {
            $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
        }
        $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
    });

    $(tiebacksDropdown).on('change', function() {
        selectedValues.tiebacks = this.value;
        finalPrice = m2mGetPrice(prices, additionalPrices, selectedValues);
        getMultiplier = $('#price-multiplier').val();

        if (getMultiplier > 1) {
            multiplierPrice = finalPrice * getMultiplier;
            $(calculatedPriceEl).text('£' + multiplierPrice.toFixed(2));
            $(calculatedPriceEl).attr('data-price', finalPrice * 100);
        } else {
            $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
        }
        $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
    });

    $('.curtain-cushion-options').on('click', '.radio-btn', function(){
        if ($(this).attr('data-value') == 'Yes') {
            selectedValues.cushions = cushionsDropdown.val();
        } else {
            selectedValues.cushions = undefined;
        }
        finalPrice = m2mGetPrice(prices, additionalPrices, selectedValues);
        getMultiplier = $('#price-multiplier').val();

        if (getMultiplier > 1) {
            multiplierPrice = finalPrice * getMultiplier;
            $(calculatedPriceEl).text('£' + multiplierPrice.toFixed(2));
            $(calculatedPriceEl).attr('data-price', finalPrice * 100);
        } else {
            $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
        }
        $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
    });

    $('.curtain-tieback-options').on('click', '.radio-btn', function(){
        if ($(this).attr('data-value') == 'Yes') {
            selectedValues.tiebacks = tiebacksDropdown.val();
        } else {
            selectedValues.tiebacks = undefined;
        }
        finalPrice = m2mGetPrice(prices, additionalPrices, selectedValues);
        getMultiplier = $('#price-multiplier').val();

        if (getMultiplier > 1) {
            multiplierPrice = finalPrice * getMultiplier;
            $(calculatedPriceEl).text('£' + multiplierPrice.toFixed(2));
            $(calculatedPriceEl).attr('data-price', finalPrice * 100);
        } else {
            $(calculatedPriceEl).text('£' + finalPrice.toFixed(2));
        }
    });
}

function m2mGetPrice(prices, additionalPrices, selectedValues) {
    var cushionsPrice = 0;
    var tiebacksPrice = 0;
    prices.forEach(function (element,index) {
        if (selectedValues.type.includes('Eyelet')) {
            if (element.type == selectedValues.type && element.eyelets == selectedValues.eyelets && element.lining == selectedValues.lining) {
                finalPrice = element.price;
            }
        } else if(selectedValues.type.includes('Roman Blinds')) {
            if (element.type == selectedValues.type && 
                element.lining == selectedValues.lining && 
                element.fixings == selectedValues.fixings && 
                element.fittings == selectedValues.fittings
                ) {
                finalPrice = element.price;
            }    
        } else {
            if (element.type == selectedValues.type && element.lining == selectedValues.lining) {
                finalPrice = element.price;
            }
        }
    });

    if (selectedValues.cushions !== undefined) {
        additionalPrices[0].forEach(function (element,index) {
            var elementName = element.name + ' - ' + element.fill;
            if (elementName == selectedValues.cushions) {
                cushionsPrice = element.price;
            }
        });
    }

    if (selectedValues.tiebacks !== undefined) {
        additionalPrices[1].forEach(function (element,index) {
            if (element.name == selectedValues.tiebacks) {
                tiebacksPrice = element.price;
            }
        });
    }

    if (cushionsPrice > 0 && tiebacksPrice > 0) {
        finalPrice = finalPrice + cushionsPrice + tiebacksPrice;
    } else if (cushionsPrice > 0 & tiebacksPrice == 0) {
        finalPrice = finalPrice + cushionsPrice;
    } else if (cushionsPrice == 0 & tiebacksPrice > 0) {
        finalPrice = finalPrice + tiebacksPrice;
    }

    return finalPrice;
}

function m2mAddToCart(event) {
    if(Shopify.theme.role == 'main')
        var url = 'https://m2m.rivahome.com/furn-m2m-add.php';
    else
        var url = 'https://staging.m2m.rivahome.com/furn-m2m-add.php';

    var form;
    var productPageChildren = $('.product').find('.m2m-tabs');
    if (productPageChildren.hasClass('m2m-tabs')) {
        var form = $('.m2m-tab.active-tab form');
    }

    var productId = $('.m2mProductId', form).val();
    var fabric = $('.m2mFabric', form).val();
    var heading = $('.m2mHeading').val();
    var eyelets = $('.m2mEyelets').val();
    var lining = $('.m2mLining').val();
    var fixings = $('#m2mFixings').val();
    var fittings = $('#m2mFittings').val();
    var cushions = $('.m2mCushions').val();
    var includeCushions = $('.m2mCushions').attr('data-option');
    var cushionsName = cushions.split(' - ')[0];
    var cushionsFilling = cushions.split(' - ')[1];
    var tiebacks = $('.m2mTiebacks').val();
    var includeTiebacks = $('.m2mTiebacks').attr('data-option');
    var quantity = $('.m2mQuantity').val();
    var unitType = $('.m2mUnits', form).val();
    var submitButton = $(event.target);

    if (heading.includes('Roman Blinds')) {
        var productType = 'blinds';
    } else {
        var productType = 'curtains';
    }

    // Check if Cushions / Tiebacks selected
    if(!m2mValidateCushionsTiebacks(event, productType)) return null;

    submitButton.addClass('loading').attr('disabled', true);;
    submitButton.find('.loading-overlay__spinner').removeClass('hidden');

    // Check if unit type is inches
    if (unitType == 'in') {
        let size = convertInchesToCm(form);
        var width = size.widthCm,
            drop = size.dropCm;
    } else {
        var width = $('.m2mWidth', form).val();
        var drop = $('.m2mDrop', form).val();
    }

    if (includeCushions == 'yes' && includeTiebacks == 'yes') {
        var params = '?product_id=' + productId + '&fabric=' + fabric + '&width=' + width + '&drop=' + drop + '&type=' + heading + '&eyelets=' + eyelets + '&lining=' + lining + '&fittings=' + fittings + '&fixings=' + fixings + '&add_cushions=' + includeCushions + '&cushions_name=' + cushionsName + '&cushions_filling=' + cushionsFilling + '&add_tiebacks=' + includeTiebacks + '&tiebacks_name=' + tiebacks;
    } else if (includeCushions == 'yes' && includeTiebacks == 'no') {
        var params = '?product_id=' + productId + '&fabric=' + fabric + '&width=' + width + '&drop=' + drop + '&type=' + heading + '&eyelets=' + eyelets + '&lining=' + lining + '&fittings=' + fittings + '&fixings=' + fixings + '&add_cushions=' + includeCushions + '&cushions_name=' + cushionsName + '&cushions_filling=' + cushionsFilling;
    } else if (includeCushions == 'no' && includeTiebacks == 'yes') {
        var params = '?product_id=' + productId + '&fabric=' + fabric + '&width=' + width + '&drop=' + drop + '&type=' + heading + '&eyelets=' + eyelets + '&lining=' + lining + '&fittings=' + fittings + '&fixings=' + fixings + '&add_tiebacks=' + includeTiebacks + '&tiebacks_name=' + tiebacks;
    } else if (includeCushions == 'no' && includeTiebacks == 'no') {
        var params = '?product_id=' + productId + '&fabric=' + fabric + '&width=' + width + '&drop=' + drop + '&type=' + heading + '&eyelets=' + eyelets + '&lining=' + lining + '&fittings=' + fittings + '&fixings=' + fixings;
    }

    var settings = {
        method: 'POST',
        url: url + params
    };

    $.ajax(settings).done(function (response) {
        var variantId = response.variant.id;
        var ajaxUrl = '/cart/add.js';

        // Get frontend only width & drop variables
        if (unitType == 'in') {
            let size = convertInchesToCm(form);
            var inWidth = $('.m2mWidth', form).val();
            var inDrop = $('.m2mDrop', form).val();
            var cmWidth = size.widthCm;
            var cmDrop = size.dropCm;
            var frontendWidth = inWidth + 'in (' + cmWidth.toFixed(1) + 'cm)';
            var frontendDrop = inDrop + 'in (' + cmDrop.toFixed(1) + 'cm)';
        } else {
            let size = convertCmToInches(form);
            var cmWidth = $('.m2mWidth', form).val();
            var cmDrop = $('.m2mDrop', form).val();
            var inWidth = size.widthInches;
            var inDrop = size.dropInches;
            var frontendWidth = cmWidth + 'cm (' + inWidth.toFixed(1) + 'in)';
            var frontendDrop = cmDrop + 'cm (' + inDrop.toFixed(1) + 'in)';
        }

        // Get frontend eyelets & lining
        var eyeletsFrontend = $('option:selected','.m2mEyelets').data("frontend-name").trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
        var liningFrontend = $('option:selected','.m2mLining').data("frontend-name").trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));

        if (heading.includes('Eyelet')) {
            if (includeCushions == 'yes' && includeTiebacks == 'yes') {
                var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + ', "properties":{ "fabric": "' + fabric + '", "width": "' + frontendWidth + '", "drop": "' + frontendDrop + '", "heading": "' + heading + '", "eyelets": "' + eyeletsFrontend + '", "lining": "' + liningFrontend + '", "cushions": "' + cushions + '", "tiebacks": "' + tiebacks + '" }}');
            } else if (includeCushions == 'yes' && includeTiebacks == 'no') {
                var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + ', "properties":{ "fabric": "' + fabric + '", "width": "' + frontendWidth + '", "drop": "' + frontendDrop + '", "heading": "' + heading + '", "eyelets": "' + eyeletsFrontend + '", "lining": "' + liningFrontend + '", "cushions": "' + cushions + '" }}');
            } else if (includeCushions == 'no' && includeTiebacks == 'yes') {
                var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + ', "properties":{ "fabric": "' + fabric + '", "width": "' + frontendWidth + '", "drop": "' + frontendDrop + '", "heading": "' + heading + '", "eyelets": "' + eyeletsFrontend + '", "lining": "' + liningFrontend + '", "tiebacks": "' + tiebacks + '" }}');
            } else if (includeCushions == 'no' && includeTiebacks == 'no') {
                var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + ', "properties":{ "fabric": "' + fabric + '", "width": "' + frontendWidth + '", "drop": "' + frontendDrop + '", "heading": "' + heading + '", "eyelets": "' + eyeletsFrontend + '", "lining": "' + liningFrontend + '" }}');
            }
        } else if(heading.includes('Roman Blinds')) {
            var fittingsFrontend = $('option:selected','#m2mFittings').data("frontend-name").trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
            var fixingsFrontend = $('option:selected','#m2mFixings').data("frontend-name").trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));    
            
            if (includeCushions == 'yes') {
                var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + ', "properties":{ "fabric": "' + fabric + '", "width": "' + frontendWidth + '", "drop": "' + frontendDrop + '", "heading": "' + heading + '", "fixings": "' + fixingsFrontend + '", "fittings": "' + fittingsFrontend + '", "lining": "' + liningFrontend + '", "cushions": "' + cushions + '" }}');
            } else {
                var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + ', "properties":{ "fabric": "' + fabric + '", "width": "' + frontendWidth + '", "drop": "' + frontendDrop + '", "heading": "' + heading + '", "fixings": "' + fixingsFrontend + '", "fittings": "' + fittingsFrontend + '", "lining": "' + liningFrontend + '" }}');
            }
        } else {
            if (includeCushions == 'yes' && includeTiebacks == 'yes') {
                var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + ', "properties":{ "fabric": "' + fabric + '", "width": "' + frontendWidth + '", "drop": "' + frontendDrop + '", "heading": "' + heading + '", "lining": "' + liningFrontend + '", "cushions": "' + cushions + '", "tiebacks": "' + tiebacks + '" }}');
            } else if (includeCushions == 'yes' && includeTiebacks == 'no') {
                var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + ', "properties":{ "fabric": "' + fabric + '", "width": "' + frontendWidth + '", "drop": "' + frontendDrop + '", "heading": "' + heading + '", "lining": "' + liningFrontend + '", "cushions": "' + cushions + '" }}');
            } else if (includeCushions == 'no' && includeTiebacks == 'yes') {
                var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + ', "properties":{ "fabric": "' + fabric + '", "width": "' + frontendWidth + '", "drop": "' + frontendDrop + '", "heading": "' + heading + '", "lining": "' + liningFrontend + '", "tiebacks": "' + tiebacks + '" }}');
            } else if (includeCushions == 'no' && includeTiebacks == 'no') {
                var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + ', "properties":{ "fabric": "' + fabric + '", "width": "' + frontendWidth + '", "drop": "' + frontendDrop + '", "heading": "' + heading + '", "lining": "' + liningFrontend + '" }}');
            }
        }

        var params = {
            type: 'POST',
            url: ajaxUrl,
            data: data,
            dataType: 'json',
            success: function(cart) {
                Shopify.onSuccess;
                submitButton.find('span').text('Added!');
                submitButton.removeClass('loading');
                submitButton.find('.loading-overlay__spinner').addClass('hidden');
                $(".cart-count-bubble").load(window.location.href + " .cart-count-bubble span" );
                setTimeout(function(){
                    submitButton.find('span').text('Add To Bag');
                    submitButton.attr('disabled', false);
                }, 5000);
            },
            error: function(XMLHttpRequest, textStatus) {
                Shopify.onError(XMLHttpRequest, textStatus);
            }
        };
        $.ajax(params);
    });
}

function addSampleToCart(e) {
    e.preventDefault();
    var variantId = e.target.getAttribute("data-id");
    var quantity = 1;
    var ajaxUrl = '/cart/add.js';
    var data = JSON.parse('{"id":"' + variantId + '", "quantity": ' + quantity + '}');

    var params = {
        type: 'POST',
        url: ajaxUrl,
        data: data,
        dataType: 'json',
        success: function(cart) {
            Shopify.onSuccess;
        },
        error: function(XMLHttpRequest, textStatus) {
            Shopify.onError(XMLHttpRequest, textStatus);
        }
    };
    $.ajax(params);
}

// Blinds / curtains tabs
var tabHeading = document.querySelectorAll('.tab-heading');
tabHeading.forEach(function(heading) {
    heading.addEventListener('click', function() {
        var contentId = this.dataset.bind;
        $(this).parent().find('.tab-heading').removeClass('active-tab');
        $(this).addClass('active-tab');

        if($(this).find('h4').text().indexOf('Blinds') >= 0)
        {
            $('.m2m-add-to-cart').removeClass('curtains-active');
            $('.m2m-add-to-cart').addClass('blinds-active');
        }
        else
        {
            $('.m2m-add-to-cart').removeClass('blinds-active');
            $('.m2m-add-to-cart').addClass('curtains-active');
        }

        //$('.variant-tab').removeClass('active-tab');
        //$(this).parent().siblings('.tab-content').find('.variant-tab').removeClass('active-tab');
        $(this).parent().siblings('.tab-content').find('.m2m-tab').removeClass('active-tab');
        //$('.variant-tab[data-bind="' + contentId + '"').addClass('active-tab');
        //$(this).parent().siblings('.tab-content').find('.variant-tab[data-bind="' + contentId + '"]').addClass('active-tab');
        $(this).parent().siblings('.tab-content').find('.m2m-tab[data-bind="' + contentId + '"]').addClass('active-tab');

        // Update min max info
        var form = $(this).parent().siblings('.tab-content').find('.m2m-tab[data-bind="' + contentId + '"]');
        var minMaxMeta = $('.m2m-min-max', form);
        var minWidth = minMaxMeta.attr('data-min-width');
        var maxWidth = minMaxMeta.attr('data-max-width');
        var minDrop = minMaxMeta.attr('data-min-drop');
        var maxDrop = minMaxMeta.attr('data-max-drop');
        var infoMinWidth = $('.m2mMinWidth');
        var infoMaxWidth = $('.m2mMaxWidth');
        var infoMinDrop = $('.m2mMinDrop');
        var infoMaxDrop = $('.m2mMaxDrop');

        infoMinWidth.html(minWidth + 'cm');
        infoMaxWidth.html(maxWidth + 'cm');
        infoMinDrop.html(minDrop + 'cm');
        infoMaxDrop.html(maxDrop + 'cm');

        // Switch units back to CM
        var unitsInput = $('.m2mUnits');
        unitsInput.val('cm');

        // Clear validation error css
        $('.m2mWidth').removeClass('validation-error');
        $('.m2mDrop').removeClass('validation-error');
        $('.size-info').removeClass('validation-error');
        $('.size-info-icon').html('<i class="fa fa-info-circle"></i>');

        // Unhide hidden headings, eyelets, fixtures & fittings
        $('.m2mHeadingIllustrated').parents('.curtain-option-wrapper').removeClass('hidden');
        $('.m2mEyeletsIllustrated').parents('.curtain-option-wrapper').removeClass('hidden');
        $('#m2mFixingsIllustrated').parents('.curtain-option-wrapper').removeClass('hidden');
        $('#m2mFittingsIllustrated').parents('.curtain-option-wrapper').removeClass('hidden');

        m2mResetForm('full');
    });
});

function m2mScrollToOptions() {
    const m2mAddToCartForm = $('.m2mAddToCartForm');
    m2mAddToCartForm[0].scrollIntoView();
}

function m2mShowDescription(event) {
    $(event.target).parent().siblings('.curtain-option--description').addClass('visible');
}

// Event listeners
if (document.getElementById('orderSample') !== null) {
    document.getElementById('orderSample').addEventListener('click', addSampleToCart, false);
}

// Collection add sample to cart
$('.ais-page').on('click', '.orderSample', function(event){
    addSampleToCart(event);
});

$('.m2mWidth').focusout(function(event){
    m2mValidateWidthDrop(event);
});

$('.m2mWidth').keypress(function(event){
    if (event.key == 'Enter') {
        m2mValidateWidthDrop(event);
    }
});

$('.m2mDrop').focusout(function(event){
    m2mValidateWidthDrop(event);
});

$('.m2mDrop').keypress(function(event){
    if (event.key == 'Enter') {
        m2mValidateWidthDrop(event);
    }
});

$('.m2mCalculatePrice').on('click', function(event) {
    m2mValidateWidthDrop(event);
    var e = jQuery.Event('enter');
    $('.m2mWidth').trigger(e);
    $('.m2mDrop').trigger(e);
    m2mScrollToOptions();
});

$('.m2mUnits').on('change', function(event) {
    m2mSwitchUnitOfMeasurement(event);
});

$('#m2mAddToCart').on('click', function(event) {
    m2mAddToCart(event);
});

$('.curtain-option-wrapper i').on('click', function(event) {
    m2mShowDescription(event);
});

$('.radio-btn').on('click', function(event){
    if ($('.m2m-add-to-cart').hasClass('blinds-active')) {
        var productType = 'blinds';
    } else if ($('.m2m-add-to-cart').hasClass('blinds-active')) {
        var productType = 'curtains';
    }

    $(event.target).parents('.curtain-options--radio-buttons').siblings('.curtain-options--dropdown').find('select').attr('data-option-selected','yes');
    m2mValidateCushionsTiebacks(event, productType);
});