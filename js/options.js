import {$} from "../library/jquery-4.0.0.slim.module.min.js";

var options = function () {

    const default_options = {
        pairs:      2,
        difficulty: 'normal',
        groupSize:  2,
        startLevel: 1,
        groupSize2: 2
    };

    var savedOptions = localStorage.options && JSON.parse(localStorage.options);
    var opts = Object.assign({}, default_options, savedOptions || {});

    // Inicialitzar inputs
    $('#pairs').val(opts.pairs);
    $('#dif').val(opts.difficulty);
    $('#groupsize').val(opts.groupSize);
    $('#startlevel').val(opts.startLevel);
    $('#groupsize2').val(opts.groupSize2);

    // Escoltar canvis
    $('#pairs').on('change',      function () { opts.pairs      = parseInt($(this).val()); });
    $('#dif').on('change',        function () { opts.difficulty = $(this).val(); });
    $('#groupsize').on('change',  function () { opts.groupSize  = parseInt($(this).val()); });
    $('#startlevel').on('change', function () { opts.startLevel = parseInt($(this).val()); });
    $('#groupsize2').on('change', function () { opts.groupSize2 = parseInt($(this).val()); });

    return {
        applyChanges: function () {
            localStorage.options = JSON.stringify(opts);
        },
        defaultValues: function () {
            opts = Object.assign({}, default_options);
            $('#pairs').val(opts.pairs);
            $('#dif').val(opts.difficulty);
            $('#groupsize').val(opts.groupSize);
            $('#startlevel').val(opts.startLevel);
            $('#groupsize2').val(opts.groupSize2);
        }
    };

}();

$('#default').on('click', function () {
    options.defaultValues();
});

$('#apply').on('click', function () {
    options.applyChanges();
    location.assign('../');
});
