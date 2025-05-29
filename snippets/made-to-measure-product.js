const swiper = new Swiper('.swiper', {pagination: {el: '.swiper-pagination'}});

var inches_to_cm = 2.54;

const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
});

var prices = null;
var options = null;

var widths = 1;

//Remove top margin on footer so the status bar is flush up to it
var footer_class = document.querySelector('.footer');
if(footer_class) footer_class.style = 'margin-top: 0 !important;';

var footer_id = document.querySelector('#footer');
if(footer_id) footer_id.style = 'margin-top: 0 !important;';

//Increment buttons
document.querySelectorAll('button.increment').forEach((el) => {
    el.addEventListener('click', function(e) {
        var input = e.target.parentNode.querySelector('input[type="number"]');

        if(input.value < parseInt(input.getAttribute('max')))
        {
            if(input.value < parseInt(input.getAttribute('min')))
                input.value = parseInt(input.getAttribute('min'));
            else
                input.value++;

            input.dispatchEvent(new Event('change'));
            updateMeasurements();
        }
    });
});

//Decrement buttons
document.querySelectorAll('button.decrement').forEach((el) => {
    el.addEventListener('click', function(e) {
        var input = e.target.parentNode.querySelector('input[type="number"]');

        if(input.value > parseInt(input.getAttribute('min')))
        {
            if(input.value > parseInt(input.getAttribute('max')))
                input.value = parseInt(input.getAttribute('max'));
            else
                input.value--
            
            input.dispatchEvent(new Event('change'));
            updateMeasurements();
        }
    });
});

//Set the intro and confirm blocks data when width, height, measurement unit, pair/single or fitting is changed
document.querySelectorAll('[name="width"]').forEach((el) => { 
    var width = el;

    el.addEventListener('change', function(e){
        if(parseInt(width.value) < parseInt(width.getAttribute('min')) || parseInt(width.value) > parseInt(width.getAttribute('max')))
            width.classList.add('error');
        else
            width.classList.remove('error');

        updateMeasurements();
    });
});

document.querySelectorAll('[name="height"]').forEach((el) => {
    var height = el;

    el.addEventListener('change', function(e){
        if(parseInt(height.value) < parseInt(height.getAttribute('min')) || parseInt(height.value) > parseInt(height.getAttribute('max')))
            height.classList.add('error');
        else
            height.classList.remove('error');

        updateMeasurements();
    });
});

document.getElementById('measurement-unit').addEventListener('change', function(e){
    updateMeasurements();
});

document.querySelectorAll('[name="pair-or-single"]').forEach((el) => {
    el.addEventListener('change', function(e){
        updateMeasurements();
    });
});

document.querySelectorAll('[name="fitting"]').forEach((el) => {
    el.addEventListener('change', function(e){
        updateMeasurements();
    });
});

//Grab the initial cost for the minimum straight away
function startCustomising(type)
{
    document.getElementById('m2m_type').value = type;

    document.querySelectorAll('.type-specific:not(.'+type+'-only)').forEach((el) => {
        el.remove();
    });

    updateMeasurements();
}

function updateMeasurements(no_refresh)
{
    var width = document.getElementById('width').value;
    var height = document.getElementById('height').value;
    var unit = document.getElementById('measurement-unit').value;
    var pair_or_single = document.querySelector('[name="pair-or-single"]:checked');
    var fitting = document.querySelector('[name="fitting"]:checked');

    var measurements_phrase = width + ' x ' + height + ' ' + unit;
    
    if(pair_or_single) 
        measurements_phrase += ' / ' + pair_or_single.value;
    
    if(fitting)
        measurements_phrase += ' / ' + fitting.value;

    measurements_phrase += ' ('+(widths == null ? 'unknown' : widths)+' width'+(widths != 1 ? 's' : '')+')';

    document.querySelectorAll('.chosen-measurements').forEach((el) => 
        el.innerHTML = measurements_phrase
    );

    if(no_refresh == null)
        refreshM2MOptions();
}

function updateFixing()
{
    var fixing_choice = getChoiceBlockSelected('fixing');
    var chain_colour = getColourSelected('chain-colour-choice');
    document.querySelectorAll('.chosen-fixing').forEach((el) => 
        el.innerHTML = 'Fixing: ' + fixing_choice + ', Chain colour: '+chain_colour
    );
}

function updateHeading()
{
    var heading_choice = getChoiceBlockSelected('heading');
    var wave_size = document.getElementById('wave-size').value;
    document.querySelectorAll('.chosen-heading').forEach((el) => 
        el.innerHTML = 'Heading: ' + heading_choice.ucwords() + (heading_choice == 'S-Wave' ? ' ('+wave_size+')' : '')
    );
}

function updateLiningColour()
{
    var lining_choice = getChoiceBlockSelected('lining', true);
    var lining_colour = getColourSelected('lining-colour-choice');
    document.querySelectorAll('.chosen-lining').forEach((el) => 
        el.innerHTML = 'Lining: ' + lining_choice + ', Colour: '+lining_colour
    );
}

function getColourSelected(colour_class)
{
    var chosen_colour = null;
    document.querySelectorAll('.'+colour_class+' .colour-option').forEach((el) => {
        if(el.classList.contains('selected'))
        {
            chosen_colour = el.querySelector('span').innerHTML;
        }
    });

    return chosen_colour;
}

function selectColour(ele)
{
    var children = [...ele.parentNode.children];
    children.forEach((el) => {
        el.classList.remove('selected');
    });

    ele.classList.add('selected');

    updateLiningColour();
    updateFixing();
}

//Add click to select for choice blocks
//NB: Done it as a global document click listener so it operates as a "live" listener
document.addEventListener('click', function(e){
    var target = e.target.closest('.choice-block li');

    if(e.target.localName == 'select') return;

    if(target)
    {
        var choice_set = target.parentNode;
        var choice_set_id = choice_set.id;
        var choice_set_id_bits = choice_set_id.split('-');
        var choice_set_name = choice_set_id_bits[0];

        //If not a multi choice block, remove all other selected first, then add selected to this one
        if(!choice_set.classList.contains('multi-choice-block'))
        {
            choice_set.querySelectorAll('li').forEach((el) => 
                el.classList.remove('selected')
            );

            target.classList.add('selected');

            var selected_title = target.querySelectorAll('h4')[0].innerHTML;
        }
        //If a multi choice block, toggle selected status instead
        else
        {
            target.classList.toggle('selected');

            var selected_titles = [];

            if(choice_set_id == 'accessories-choice')
            {
                //Special treatment to join up the selected options rather then accessories titles
                target.parentNode.querySelectorAll('.selected').forEach((el) => {
                    var selected_accessory = document.getElementById(el.id + '-options').value;

                    if(el.id == 'cushions')
                        selected_accessory += ' (qty '+document.getElementById('cushions-qty').value+')';

                    selected_titles.push(selected_accessory);
                });
            }
            else
            {
                target.parentNode.querySelectorAll('.selected h4').forEach((el) =>
                    selected_titles.push(el.innerHTML)
                );
            }

            var selected_title = selected_titles.join(', ');

            if(selected_titles.length == 0 && target.parentNode.getAttribute('data-default'))
                selected_title = target.parentNode.getAttribute('data-default');
        }

        //Show/Hide the lining colour dropdown when lining choice is changed
        if(choice_set_id == 'lining-choice')
        {
            if(selected_title == 'Thermal Blackout' || selected_title == 'Cotton Sateen (standard)')
            {
                document.getElementById('lining-colour-container').classList.remove('hidden');
            }
            else
            {
                document.getElementById('lining-colour-container').classList.add('hidden');
            }
        }

        //Show/Hide the S-Wave size dropdown when heading choice is changed
        if(choice_set_id == 'heading-choice')
        {
            if(selected_title == 'S-Wave')
            {
                document.getElementById('wave-specific').classList.remove('hidden');
            }
            else
            {
                document.getElementById('wave-specific').classList.add('hidden');
            }
        }

        //Set the intro and confirm blocks data based on what is selected
        document.querySelectorAll('.chosen-'+choice_set_name).forEach((el) => {
            if(choice_set_name == 'fixing')
            {
                var chain_colour = getColourSelected('chain-colour-choice');
                el.innerHTML = capitalizeFirstLetter(choice_set_name) + ': ' + selected_title + ', Chain colour: '+chain_colour;
            }
            else if(choice_set_name == 'lining' && (selected_title == 'Thermal Blackout') || selected_title == 'Cotton Sateen (standard)')
            {
                var lining_colour = getColourSelected('lining-colour-choice');
                el.innerHTML = capitalizeFirstLetter(choice_set_name) + ': ' + selected_title + ', Colour: '+lining_colour;
            }
            else if(choice_set_name == 'heading')
            {
                var wave_size = document.getElementById('wave-size').value;
                el.innerHTML = capitalizeFirstLetter(choice_set_name) + ': ' + selected_title + (selected_title == 'S-Wave' ? ' ('+wave_size+')' : '');
            }
            else 
            {
                el.innerHTML = (choice_set_name != 'accessories' ? capitalizeFirstLetter(choice_set_name) + ': ' : '') + selected_title;
            }
        });

        if(target.id == 'cushions' || target.id == 'tiebacks')
            document.getElementById(target.id + '-options-container').classList.toggle('hidden');

        //Special case for eyelets: need to hide the choices if a non-eyelet curtain type is chosen
        if(choice_set_name == 'heading')
        {
            if(selected_title == 'Double Rolled Eyelets')
            {
                document.getElementById('no-eyelet-choice-required').classList.add('hidden');
                document.getElementById('eyelet-choice').classList.remove('hidden');
            }
            else
            {
                document.getElementById('eyelet-choice').classList.add('hidden');
                document.getElementById('no-eyelet-choice-required').classList.remove('hidden');
            }
        }

        //Set eyelet summary titles to N/A or the actual eyelet choice, depending on if the choice is available
        if(document.getElementById('no-eyelet-choice-required') != null && 
        !document.getElementById('no-eyelet-choice-required').classList.contains('hidden'))
        {
            document.querySelectorAll('.chosen-eyelet').forEach((el) => 
                el.innerHTML = 'No eyelets required'
            );
        }
        else
        {
            document.querySelectorAll('.chosen-eyelet').forEach((el) => 
                el.innerHTML = 'Eyelet: ' + document.querySelectorAll('#eyelet-choice li.selected h4')[0].innerHTML
            );
        }

        setPrice();
    }
});

function updateAccessories(e)
{
    var cushions = document.getElementById('cushions-options').value + ' (qty '+document.getElementById('cushions-qty').value+')';

    var tiebacks = '';
    if(document.getElementById('tiebacks-options'))
        tiebacks = document.getElementById('tiebacks-options').value;

    var selected_titles = [];

    if(!document.getElementById('cushions-options-container').classList.contains('hidden'))
        selected_titles.push(cushions);

    if(tiebacks != '' && !document.getElementById('tiebacks-options-container').classList.contains('hidden'))
        selected_titles.push(tiebacks);

    var selected_title = selected_titles.join(', ');

    document.querySelectorAll('.chosen-accessories').forEach((el) => 
        el.innerHTML = selected_title
    );

    setPrice();
}

function refreshM2MOptions()
{
    var fabric = document.getElementById('m2m_fabric').value;
    var product_type = document.getElementById('m2m_type').value;

    var width = document.getElementById('width').value;
    var height = document.getElementById('height').value;

    var getMultiplier = $('#price-multiplier').val();
    var getPriceToggle = $('[name="metafield[b2b.price_toggle]"]:checked').val();

    //Convert inches to cm if needed
    var measurement_unit = document.getElementById('measurement-unit').value;
    if(measurement_unit == 'inch')
    {
        width *= inches_to_cm;
        height *= inches_to_cm;
    }

    if(Shopify.theme.role == 'main')
        var url = 'https://m2m.rivahome.com/furn-m2m-prices.php';
    else
        var url = 'https://staging.m2m.rivahome.com/furn-m2m-prices.php';

    fetch(url + '?' + new URLSearchParams({
        width: width,
        drop: height,
        fabric: fabric,
        productType: product_type
    }))
    .then(res => res.json())
    .then(response => {
        //Linings
        if(document.querySelectorAll('#lining-choice li').length == 0)
        {
            response.linings.forEach((el, i) => {
                if(product_type == 'blinds' && el.name == 'UNLINED')
                    return; //continue

                var li = createChoiceBlock(el, 'lining', i == 0 ? true : false);

                //Set default selected one in summary blocks
                if(i == 0)
                    document.querySelectorAll('.chosen-lining').forEach((el2) => {
                        el2.innerHTML = 'Lining: ' + el.frontend_name.ucwords();

                        if(el.frontend_name.ucwords() == 'Thermal Blackout' || el.frontend_name.ucwords() == 'Cotton Sateen (standard)')
                            el2.innerHTML += ', Colour: White';
                    });

                document.getElementById('lining-choice').appendChild(li);
            });
        }

        //Eyelets
        if(document.getElementById('eyelet-choice'))
        {
            if(document.querySelectorAll('#eyelet-choice li').length == 0)
            {
                response.eyelets.forEach((el, i) => {
                    var li = createChoiceBlock(el, 'eyelet', i == 0 ? true : false);

                    //Set default selected one in summary blocks
                    if(i == 0)
                    document.querySelectorAll('.chosen-eyelet').forEach((el2) => 
                        el2.innerHTML = 'Eyelet: ' + el.frontend_name.ucwords()
                    );

                    document.getElementById('eyelet-choice').appendChild(li);
                });
            }
        }

        //Types (Headings)
        if(document.getElementById('heading-choice'))
        {
            if(document.querySelectorAll('#heading-choice li').length == 0)
            {
                response.types.forEach((el, i) => {
                    if(el == 'Roman Blinds') 
                        return; //continue

                    var li = createChoiceBlock(el, 'heading', i == 0 ? true : false);

                    //Set default selected one in summary blocks
                    if(i == 0)
                    document.querySelectorAll('.chosen-heading').forEach((el2) => 
                        el2.innerHTML = 'Heading: '+ el.ucwords()
                    );

                    document.getElementById('heading-choice').appendChild(li);
                });
            }
        }

        //Cushions
        if(document.getElementById('cushions-options'))
        {
            if(document.querySelectorAll('#cushions-options option').length == 0)
            {
                response.options.cushions.forEach((el, i) => {
                    var option = document.createElement('option');
                    option.value = el.name + ' - ' + el.fill;
                    option.innerHTML = el.name + ' - ' + el.fill + (getPriceToggle == 'Off' ? '' : ' (+' + formatter.format(el.price * getMultiplier) + ')');

                    document.getElementById('cushions-options').appendChild(option);
                });
            }
        }

        //Tie backs
        if(document.getElementById('tiebacks-options'))
        {
            //Tiebacks options can change (if width/drop is edited), so remove and re-add
            //NB: This means it will "forget" your choice. (However there is current only one choice!)
            document.querySelectorAll('#tiebacks-options option').forEach(e => e.remove());
            
            response.options.tiebacks.forEach((el, i) => {
                var option = document.createElement('option');
                option.value = el.name;
                option.innerHTML = el.name + (getPriceToggle == 'Off' ? '' : ' (+' + formatter.format(el.price * getMultiplier) + ')');

                document.getElementById('tiebacks-options').appendChild(option);
            });
        }
        
        //Set initial prices
        prices = response.prices;
        options = response.options;

        setPrice();
    })
    .catch(err => {
        console.error(err);
    });
}

function createChoiceBlock(el, type, selected)
{
    var id = el;
    var title = el;
    if(el.name != null)
    {
        id = el.name;
        title = el.frontend_name;
    }

    title = title.ucwords();

    var image = typeof options_data[type][title] != "undefined" && 
        typeof options_data[type][title]['image'] != "undefined" ? options_data[type][title]['image'] : null;

    if(image == null || image == '')
        image = 'https://dummyimage.com/145&text=placeholder';

    var li = document.createElement('li');
    li.setAttribute('data-name', id);

    if(selected)
        li.setAttribute('class', 'selected');

    var inner_li = document.createElement('div');
    inner_li.setAttribute('class', 'inner-li');
    li.appendChild(inner_li);
    
    var h4 = document.createElement('h4');
    h4.innerHTML = title;
    inner_li.appendChild(h4);
    
    var img = document.createElement('img');
    img.setAttribute('src',image);
    inner_li.appendChild(img);

    return li;
}

function setPrice()
{
    var getMultiplier = $('#price-multiplier').val();
    var product_type = document.getElementById('m2m_type').value;
    var lining = getChoiceBlockSelected('lining');

    if(product_type == 'blinds')
    {
        var fitting = document.querySelector('[name="fitting"]:checked').value;
        var fixing = getChoiceBlockSelected('fixing'); 

        var price = getBlindsPrice(prices, lining, fitting, fixing);
    }
    else if(product_type == 'curtains')
    {
        var heading = getChoiceBlockSelected('heading');
        var eyelet = getChoiceBlockSelected('eyelet');

        var price = getCurtainsPrice(prices, lining, heading, eyelet);
    }
    
    var accessories = getChoiceBlockSelected('accessories');
    var accessories_price = 0;

    if(accessories['tiebacks'])
    {
        options.tiebacks.forEach((el) => {
            if(el.name == accessories['tiebacks'])
                accessories_price += el.price;
        });
    }

    if(accessories['cushions'])
    {
        var cushions_qty = parseInt(document.getElementById('cushions-qty').value);
        var cushions_bits = accessories['cushions'].split(' - ');

        options.cushions.forEach((el) => {
            if(el.name == cushions_bits[0] && el.fill == cushions_bits[1])
                accessories_price += el.price * (cushions_qty / 2);
        });
    }

    price *= getMultiplier;
    accessories_price *= getMultiplier;

    document.querySelectorAll('.total-price').forEach((el) => {
        el.innerHTML = formatter.format(parseFloat(price) + parseFloat(accessories_price));
    });

    //Set widths required
    var heading = getChoiceBlockSelected('heading');
    prices.forEach((el, i) => {
        if(heading == null && el.type == 'Roman Blinds')
            widths = el.widths
        else if(el.type == getChoiceBlockSelected('heading'))
            widths = el.widths;
    });

    updateMeasurements('no_refresh');
}

function getChoiceBlockSelected(name, frontend_name)
{
    var choice_block = document.getElementById(name + '-choice');

    if(choice_block == null)
        return null;

    if(choice_block.classList.contains('multi-choice-block'))
    {
        var selected = [];
        choice_block.querySelectorAll('.selected').forEach((el) => {
            selected[el.id] = document.getElementById(el.id + '-options').value;
        });
        return selected;
    }
    else
    {
        if(choice_block.querySelectorAll('.selected').length == 0)
            return null;

        return (frontend_name == null ? 
            choice_block.querySelectorAll('.selected')[0].getAttribute('data-name') : 
            choice_block.querySelectorAll('.selected')[0].querySelector('h4').innerHTML
        );
    }
}

function getCurtainsPrice(prices, lining, heading, eyelet)
{
    var price = 0;
    prices.forEach((el) => {
        if(el.type == 'Double Rolled Eyelets')
        {
            if(el.type == heading && el.lining == lining && el.eyelets == eyelet)
                price = el.price;
        }
        else
        {
            if(el.type == heading && el.lining == lining)
                price = el.price;
        }
    });

    return price;
}

function getBlindsPrice(prices, lining, fitting, fixing)
{
    var price = 0;
    prices.forEach((el) => {
        if(el.type == 'Roman Blinds' && el.lining == lining && el.fixings == fixing && el.fittings == fitting)
            price = el.price;
    });

    return price;
}

String.prototype.ucwords = function() {
    str = this.toLowerCase();
    return str.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g,
        function(s){
          return s.toUpperCase();
        });
};

function swapMeasurementUnit()
{
    var measurement_unit = document.getElementById('measurement-unit').value;

    var width_input = document.getElementById('width');
    var height_input = document.getElementById('height');
    
    if(measurement_unit == 'inch')
    {
        //If inch, set min, max and value for slider and input to cm / conversion factor
        width_input.setAttribute('min', Math.ceil(width_input.getAttribute('data-min-cm') / inches_to_cm));
        width_input.setAttribute('max', Math.floor(width_input.getAttribute('data-max-cm') / inches_to_cm));

        height_input.setAttribute('min', Math.ceil(height_input.getAttribute('data-min-cm') / inches_to_cm));
        height_input.setAttribute('max', Math.floor(height_input.getAttribute('data-max-cm') / inches_to_cm));

        height_input.value = Math.ceil(height_input.getAttribute('data-min-cm') / inches_to_cm);
        width_input.value = Math.ceil(width_input.getAttribute('data-min-cm') / inches_to_cm);
    }
    else
    {
        //Else if cm, set min and max back to default, set value also back to min cm
        width_input.setAttribute('min', width_input.getAttribute('data-min-cm'));
        width_input.setAttribute('max', width_input.getAttribute('data-max-cm'));

        height_input.setAttribute('min', height_input.getAttribute('data-min-cm'));
        height_input.setAttribute('max', height_input.getAttribute('data-max-cm'));

        height_input.value = height_input.getAttribute('data-min-cm');
        width_input.value = width_input.getAttribute('data-min-cm');
    }

    setPrice();
}

function addM2MToCart()
{
    var submitButton = $('#m2m-add-to-cart');
    submitButton.addClass('loading').attr('disabled', true);
    submitButton.find('.loading-overlay__spinner').removeClass('hidden');

    var product_id = document.getElementById('product_id').value;

    var product_type = document.getElementById('m2m_type').value;
    var type;
    if(product_type == 'blinds')
        type = 'Roman Blinds';
    else
        type = getChoiceBlockSelected('heading');

    var fabric = document.getElementById('m2m_fabric').value;

    var eyelet = getChoiceBlockSelected('eyelet');
    var lining = getChoiceBlockSelected('lining');
    var fixing = getChoiceBlockSelected('fixing');
    var fitting = document.querySelector('[name="fitting"]:checked').value;
    var style = getChoiceBlockSelected('style');
    var lining_colour = getColourSelected('lining-colour-choice');

    var chain_colour = '';
    if(document.getElementById('chain-colour-container') != null)
        chain_colour = getColourSelected('chain-colour-choice');

    if(lining != 'BUCKINGHAM BLACKOUT - M22 - IVORY' && lining != 'SHERWOOD SATIN - 345 - PALE IVORY')
        lining_colour = '';

    var add_cushions = 'no';
    var add_tiebacks = 'no';
    var cushions_name = '';
    var cushions_filling = '';
    var tiebacks_name = '';
    var accessories = getChoiceBlockSelected('accessories');
    var cushions_qty = 0;

    var wave_size = '';

    if(type == 'S-Wave')
        wave_size = document.getElementById('wave-size').value;
    
    if(accessories['cushions'])
    {
        add_cushions = 'yes';
        var cushions_bits = accessories['cushions'].split(' - ');
        var cushions_name = cushions_bits[0];
        var cushions_filling = cushions_bits[1];
        cushions_qty = document.getElementById('cushions-qty').value;
    }

    if(accessories['tiebacks'])
    {
        add_tiebacks = 'yes';
        var tiebacks_name = accessories['tiebacks'];
    }

    var width = document.getElementById('width').value;
    var height = document.getElementById('height').value;

    var pair_or_single = 'N/A';
    var pair_or_single_el = document.querySelector('[name="pair-or-single"]:checked');
    if(pair_or_single_el)
        pair_or_single = pair_or_single_el.value;

    //Convert inches to cm if needed
    var measurement_unit = document.getElementById('measurement-unit').value;
    if(measurement_unit == 'inch')
    {
        var widthInches = width;
        var heightInches = height;
        width *= inches_to_cm;
        height *= inches_to_cm;
    }

    if(Shopify.theme.role == 'main')
        var url = 'https://m2m.rivahome.com/furn-m2m-add.php';
    else
        var url = 'https://staging.m2m.rivahome.com/furn-m2m-add.php';

    fetch(url + '?' + new URLSearchParams({
        product_id: product_id,
        width: width,
        drop: height,
        fabric: fabric,
        type: type,
        eyelets: eyelet,
        lining: lining,
        fixings: fixing,
        fittings: fitting,
        add_cushions: add_cushions,
        cushions_name: cushions_name,
        cushions_filling: cushions_filling,
        add_tiebacks: add_tiebacks,
        tiebacks_name: tiebacks_name,
        pair_or_single: pair_or_single,
        style: style,
        chain_colour: chain_colour,
        lining_colour: lining_colour,
        cushions_qty: cushions_qty,
        wave_size: wave_size
    }))
    .then(res => res.json())
    .then(response => {
        console.log('Created variation');
        console.log(response);

        var variant_id = response.variant.id;
        var qty = document.getElementById('qty').value;

        if (measurement_unit == 'inch') 
        {
            var frontendWidth = widthInches + 'in (' + width.toFixed(1) + 'cm)';
            var frontendDrop = heightInches + 'in (' + height.toFixed(1) + 'cm)';
        } 
        else 
        {
            let size = convertCmToInches2();
            var inWidth = size.widthInches;
            var inDrop = size.dropInches;
            var frontendWidth = width + 'cm (' + inWidth.toFixed(1) + 'in)';
            var frontendDrop = height + 'cm (' + inDrop.toFixed(1) + 'in)';
        }

        //Build add to cart data
        var data = {
            id: variant_id, 
            quantity: qty, 
            properties:
            {
                'Fabric': fabric, 
                'Width': frontendWidth, 
                'Drop': frontendDrop,
                'Heading': type + (wave_size != '' ? ' ('+wave_size+')' : ''), 
                'Lining': lining + (lining_colour != '' ? ' (Colour: '+lining_colour+')' : '')
            }
        };

        if(type.includes('Eyelet')) 
        {
            data.properties['Eyelets'] = eyelet;
        }
        else if(type.includes('S-Wave'))
        {
            data.properties['Wave size'] = wave_size;
        }
        else if(type.includes('Roman Blinds')) 
        {
            data.properties['Fixings'] = fixing;
            data.properties['Fittings'] = fitting;
            data.properties['Style'] = style;
            data.properties['Chain colour'] = chain_colour;
        } 

        if(add_cushions == 'yes')
            data.properties['Cushions'] = cushions_name + ' - ' + cushions_filling + ' (qty '+cushions_qty+')';

        if(add_tiebacks == 'yes')
            data.properties['Tie backs'] = tiebacks_name;

        if(pair_or_single != 'N/A')
            data.properties['Pair or single'] = pair_or_single;

        fetch('/cart/add.js', {
            body: JSON.stringify(data),
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        }).then(res => res.json())
        .then(response => {
            console.log('Added variation to cart');
            console.log(response);

            Shopify.onSuccess;

            submitButton.find('span').text('Added!');
            submitButton.removeClass('loading');
            submitButton.find('.loading-overlay__spinner').addClass('hidden');
            $(".cart-count-bubble").load(window.location.href + " .cart-count-bubble span" );

            setTimeout(function(){
                submitButton.find('span').text('Add to bag');
                submitButton.attr('disabled', false);
            }, 5000);
        })
        .catch(err => {
            console.error('Problem adding variation to cart');
            console.error(err);
        });
    })
    .catch(err => {
        console.error('Problem creating variation');
        console.error(err);
    });
}

function convertInchesToCm2() {
    var widthInches = document.getElementById('width').value;
    var dropInches =document.getElementById('height').value;

    // Convert inches to cm
    var widthCm = widthInches * inches_to_cm;
    var dropCm = dropInches * inches_to_cm;
    
    return {
        widthCm,
        dropCm
    };
}

function convertCmToInches2() {
    var widthCm = document.getElementById('width').value;
    var dropCm = document.getElementById('height').value;

    // Convert cm to inches
    var widthInches = widthCm / inches_to_cm;
    var dropInches = dropCm / inches_to_cm;

    return {
        widthInches,
        dropInches
    };
}

document.querySelectorAll('.help-icon').forEach((el) => {
    el.addEventListener('click', function(e){ 
        var target = e.target.nextElementSibling;
        target.classList.toggle('active');
    });
});

document.body.addEventListener('mousedown', function(e){
    if(e.target.classList.contains('help-icon'))
        return;

    document.querySelectorAll('.help-content').forEach((el) => {
        el.classList.remove('active');
    });
});

document.querySelectorAll('.m2m-next, .m2m-back, .m2m-nav').forEach((el) => {
    el.addEventListener('click', function(e){

        //Don't do anything on status nav link if not active (prevent jump ahead)
        if(el.parentNode.parentNode.id == 'm2m-footer' && el.classList.contains('m2m-nav') && !el.classList.contains('active'))
            return;

        //Get current step number
        var current_step = 0;
        document.querySelectorAll('.m2m-step').forEach((el) => {
            if(!el.classList.contains('hidden'))
                if(parseInt(el.getAttribute('data-step')) > current_step)
                    current_step = parseInt(el.getAttribute('data-step'));
        });

        //If doing a next or back
        if(el.classList.contains('m2m-back') || el.classList.contains('m2m-next'))
        {
            //Next
            if(el.classList.contains('m2m-next'))
            {
                //If we're on the measurements step, validate the min/max before allowing the user to proceed
                if(current_step == 1)
                {
                    if(document.getElementById('width').classList.contains('error') || document.getElementById('height').classList.contains('error'))
                        return;
                }

                //Increment step num
                current_step++;

                //Unhide the product summary info line
                document.querySelectorAll('.product-breakdown li').forEach((el, i) => {
                    if(i < current_step)
                        el.classList.remove('hidden');
                });
            }
            //Back, decrement step num
            else if(el.classList.contains('m2m-back'))
                current_step--;
        }
        //Else if doing a nav, current step needs to be set to where the link wants us to go
        else if(el.classList.contains('m2m-nav'))
            var current_step = el.getAttribute('data-step-nav');

        //Hide all steps
        document.querySelectorAll('.m2m-step').forEach((el) => {
            el.classList.add('hidden');
        });

        //Show the destination step
        document.querySelector('[data-step="'+current_step+'"]').classList.remove('hidden');

        //If now on last step or first step, hide header and footer
        var steps = document.querySelectorAll('.m2m-step');
        var last_step_num = steps[steps.length - 1].getAttribute('data-step');
        if(current_step == 0 || current_step == last_step_num)
        {
            document.getElementById('m2m-header').classList.add('hidden');
            document.getElementById('m2m-footer').classList.add('hidden');
        }
        else //Not first or last step, show header and footer
        {
            document.getElementById('m2m-header').classList.remove('hidden');
            document.getElementById('m2m-footer').classList.remove('hidden');
        }

        //Highlight current step in status line footer
        var status_line = document.querySelectorAll('#m2m-footer li');

        status_line.forEach((el) => {
            el.classList.remove('active');
        });

        for(x = 0; x < current_step; x++)
            if(typeof status_line[x] != 'undefined')
                status_line[x].classList.add('active');

        //Activate back button
        if(current_step > 1)
            document.querySelector('.m2m-back').removeAttribute('disabled');
        else
            document.querySelector('.m2m-back').setAttribute('disabled', true);
    });
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}