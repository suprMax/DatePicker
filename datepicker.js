// ==================================================================
// INIT SECTION
// ==================================================================
var DatePicker = function(container, options) {
    this.container = (typeof container === 'string') ? $(container) : container;

    if (!this.container.length) {
        console.log('[DatePicker]: no container provided or found');
    }

    this.options = $.extend({
        selectors: {
            monthsHolder: '.dp-months-holder',
            viewport: '.dp-viewport',
            vpsel: '.dp-viewport-sel',

            calCrop: '.dp-cal-crop',
            calWrap: '.dp-cal-wrap',

            calHolder: '.dp-cal-holder',
            calControls: '.dp-cal-controls',

            calHandles: '.dp-cal-handle',
            lArea: '.dp-cal-left-area',
            rArea: '.dp-cal-right-area',
            mArea: '.dp-cal-middle-area',
            
            trans: '.dp-translucency',

            lHandle: '.dp-cal-left-handle',
            rHandle: '.dp-cal-right-handle'
        },
        months: 11,
        defaultNights: 4
    }, options);

    this.profiler = {
        start: +(new Date())
    }
};
DatePicker.prototype.locale = {
    month_labels: ['январь', 'февраль', 'март', 'апрель',
                   'май', 'июнь', 'июль', 'август', 'сентябрь',
                   'октябрь', 'ноябрь', 'декабрь']
};
DatePicker.prototype.init = function() {
    console.log('init: ' + ((+(new Date()) - this.profiler.start)));

    this.state = {};
    this.els = {};
    this.sizes = {};
    
    for (var prop in this.options.selectors) {
        this.els[prop] = this.container.find(this.options.selectors[prop]);
    }
    
    console.log('select: ' + ((+(new Date()) - this.profiler.start)));

    this.now = new Date();
    this.today = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
    this.start = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    this.end = new Date(this.start.getFullYear(), this.start.getMonth() + this.options.months, this.start.getDate());

    this.generateCalendar();
    console.log('calendar: ' + ((+(new Date()) - this.profiler.start)));
    
    this.getSizes();
    
    this.generateLabels();
    console.log('labels: ' + ((+(new Date()) - this.profiler.start)));
    
    this.setSizes();

    this.logic();
};
// ==================================================================
// GENERATION SEKSHEN
// ==================================================================
DatePicker.prototype.generateCalendar = function() {
    this.els.calendar = $(Calendar.generate({
        start: {
            year: this.start.getFullYear(),
            month: this.start.getMonth() + 1
        },
        end: {
            year: this.end.getFullYear(),
            month: this.end.getMonth() + 1
        },
        daylabels: true,
        monthlabels: true,
        mlabels_firstday: true,
        type: 'list'
    }));

    this.els.calHolder.html(this.els.calendar);
    this.els.cells = this.els.calendar.children('.calendar-day');
};
DatePicker.prototype.getSizes = function() {    
    this.sizes.cell = this.els.cells.eq(0).outerWidth();
    this.sizes.calendar = this.sizes.cell * this.els.cells.length;

    this.sizes.offset = this.els.calCrop.offset().left;

    this.sizes.wrap = this.els.calCrop.outerWidth();
    this.sizes.shift = parseInt(this.els.calWrap.css('left'), 10);
    
    this.sizes.minindex = this.today.getDate() - 1;
    this.sizes.minindexpos = this.sizes.minindex * this.sizes.cell;

    this.sizes.monthLabel = (this.sizes.wrap / (this.options.months + 1)) | 0;
    this.sizes.viewpos = 0;
    this.sizes.viewport = (this.sizes.wrap * this.sizes.wrap) / (this.sizes.wrap + this.sizes.calendar);

    this.sizes.monthq = this.sizes.cell / (this.sizes.calendar / this.sizes.wrap);
};
DatePicker.prototype.generateLabels = function() {
    var monthLabels = '<ul class="calendar-month-labels">',
        curr = this.start.getMonth(),
        year = this.start.getFullYear(),
        len = 0,
        
        width = 0,
        sum = 0;

    for (var i = 0; i <= this.options.months; i++) {
        len = Calendar.getDaysNum(year, curr);
        width = (this.sizes.monthq * len) | 0;
        sum += width;
        monthLabels += '<li style="width: ' + width + 'px;">' + this.locale.month_labels[curr] + '<\/li>';
        curr = (curr === 11) ? 0 : (curr + 1);
    }

    monthLabels += '<\/ul>';
    
    this.els.monthsLabels = $(monthLabels);
    this.els.monthsLabels.css({ width: sum });
    this.els.monthsHolder.prepend(this.els.monthsLabels);
};
DatePicker.prototype.setSizes = function() {
    this.els.calendar.css({ width: this.sizes.calendar });
    this.els.viewport.css({ width: this.sizes.viewport, left: 0 });

    this.setCalPos(this.sizes.minindexpos);
};
// ==================================================================
// LOGYK SECTION
// ==================================================================
DatePicker.prototype.logic = function() {
    this.mainLogic();
    this.labelsLogic();
    this.calendarLogic();
    this.controlsLogic();
};
DatePicker.prototype.mainLogic = function() {
    var that = this;
    var resetOffset = function() {
        that.sizes.offset = that.els.calCrop.offset().left;
    };
    
    $(window).on('resize', resetOffset);
    
    if (/*@cc_on!@*/false) { // check for Internet Explorer
        var preventSelect = function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        this.container.on('selectstart', preventSelect);
    }
};
DatePicker.prototype.labelsLogic = function() {
    var that = this,
        doc = $(document),
        renderT = +(new Date());
        
    var vpDragStart = function(e) {
        doc.on('mousemove.datepicker', vpDragMove);
        doc.on('mouseup.datepicker', vpDragEnd);
    };
    var vpDragMove = function(e) {
        var now = +(new Date());
        if (now - renderT < 30) {
            return;
        }

        renderT = now;
        that.calSlide(e.pageX - that.sizes.offset - that.sizes.viewport / 2);
    };
    var vpDragEnd = function(e) {
        doc.off('mousemove.datepicker', vpDragMove);
        doc.off('mouseup.datepicker', vpDragEnd);
    };
    
    var vpMoveByClick = function(e) {
        that.calSlide(e.pageX - that.sizes.offset - that.sizes.viewport / 2);
    };

    this.els.viewport.on('mousedown', vpDragStart);
    this.els.monthsHolder.on('click', vpMoveByClick);
};
DatePicker.prototype.calendarLogic = function() {
    var that = this;
    var handleCellsClick = function(e) {
        var el = $(this),
            date = el.data('date'),
            dateO = that.YMDToDate(date),
            ndateO = new Date(dateO.getFullYear(), dateO.getMonth(), dateO.getDate() + that.options.defaultNights),
            limO = new Date(that.end.getFullYear(), that.end.getMonth(), Calendar.getDaysNum(that.end.getFullYear(), that.end.getMonth())),
            ndate = that.dateToYMD(ndateO);

        if (+dateO < +that.today) {
            date = that.dateToYMD(that.today);
            ndate = that.dateToYMD(new Date(that.today.getFullYear(), that.today.getMonth(), that.today.getDate() + that.options.defaultNights));
        }
            
        if (+ndateO > +limO) {
            date = that.dateToYMD(new Date(limO.getFullYear(), limO.getMonth(), limO.getDate() - that.options.defaultNights));
            ndate = that.dateToYMD(limO);
        }

        that.state.lDate = date;
        that.state.rDate = ndate;

        that.setPosFromDates();
        that.container.addClass('controls');

        that.els.calendar.off('click', '.calendar-day', handleCellsClick);
    };
    this.els.calendar.on('click', '.calendar-day', handleCellsClick);
};

DatePicker.prototype.controlsLogic = function() {
    var that = this,
        doc = $(document),
        renderT = +(new Date()),
        len = that.els.cells.length,
        
        // handles specific
        left,
        
        //areas specific
        mWidth,
        mLeft,
        startP;
        
    var checkLeftPos = function(pos) {
        return ((that.sizes.shift !== 0) && (pos - that.sizes.offset - that.sizes.cell < 0));
    };
    
    var checkRightPos = function(pos) {
        return ((that.sizes.shift - that.sizes.wrap !== that.sizes.calendar) && (pos - that.sizes.offset - that.sizes.wrap + that.sizes.cell > 0));
    };

    var handleDragStart = function(e) {
        var el = $(this);
        
        left = el.hasClass('dp-cal-left-handle');
        that.els.calWrap.addClass('dragging');

        doc.on('mousemove.datepicker', handleDragMove);
        doc.on('mouseup.datepicker', handleDragEnd);
    };
    var handleDragMove = function(e) {
        var now = +(new Date());
        if (now - renderT < 30) {
            return;
        }

        renderT = now;

        var x = e.pageX - that.sizes.offset - that.sizes.shift;
        
        if (left) {
            that.state.lHandle = Math.min(that.state.rHandle - 1, Math.max(that.sizes.minindex, Math.ceil(x / that.sizes.cell) - 1));        
            checkLeftPos(e.pageX) && that.calSlideLeft();
        }
        else {
            that.state.rHandle = Math.min(len - 1, Math.max(that.state.lHandle + 1, Math.ceil(x / that.sizes.cell) - 1));
            checkRightPos(e.pageX) && that.calSlideRight();
        }

        that.setHandlePos();
    };
    var handleDragEnd = function(e) {
        doc.off('mousemove.datepicker', handleDragMove);
        doc.off('mouseup.datepicker', handleDragEnd);
        
        that.setMiddlePos();
        that.setVPSelPos();
        that.setDatesFromPos();

        that.els.calWrap.removeClass('dragging');
    };
    
    var areaDragStart = function(e) {
        e.stopPropagation();
        
        mWidth = that.els.mArea.width();
        mLeft = that.els.mArea.offset().left;
        startP = e.pageX;

        doc.on('mousemove.datepicker', areaDragMove);
        doc.on('mouseup.datepicker', areaDragEnd);
    };
    var areaDragMove = function(e) {
        var now = +(new Date());
        if (now - renderT < 30) {
            return;
        }

        renderT = now;

        var diff = e.pageX - startP - that.sizes.offset - that.sizes.shift,
            idiff = that.state.rHandle - that.state.lHandle,
            x, i;
        
        if (e.pageX - startP <= 0) {
            x = mLeft + diff;
            i = Math.min(len - 1 + idiff, Math.max(that.sizes.minindex, Math.ceil(x / that.sizes.cell) - 1));
            that.state.lHandle = i;
            that.state.rHandle = i + idiff;

            checkLeftPos(e.pageX - mWidth) && that.calSlideLeft();
        }
        else {
            x = mLeft + mWidth + diff;
            i = Math.min(len - 1, Math.max(that.sizes.minindex + idiff, Math.ceil(x / that.sizes.cell) - 1));
            that.state.lHandle = i - idiff;
            that.state.rHandle = i;

            checkRightPos(e.pageX + mWidth) && that.calSlideRight();
        }
        
        // FIXME: shift controls holder instead of moving the handles
        that.setHandlePos();
        that.setMiddlePos();
        that.setVPSelPos();
    };
    var areaDragEnd = function(e) {
        doc.off('mousemove.datepicker', areaDragMove);
        doc.off('mouseup.datepicker', areaDragEnd);
        
        that.setDatesFromPos();
    };

    var areaMoveByClick = function(e) {
        var pos = e.pageX - (that.els.mArea.width() / 2) - that.sizes.offset - that.sizes.shift,
            x = pos,
            idiff = that.state.rHandle - that.state.lHandle,
            i = Math.min(len - 1 - idiff, Math.max(that.sizes.minindex, Math.ceil(x / that.sizes.cell) - 1));
            
        that.state.lHandle = i;
        that.state.rHandle = i + idiff;
        that.setHandlePos();
        that.setMiddlePos();
        that.setVPSelPos();
    };

    this.els.calHandles.on('mousedown', handleDragStart);
    this.els.mArea.on('mousedown', areaDragStart);
    
    this.els.trans.on('click', areaMoveByClick);
};
// ==================================================================
// UTILITY SECTION
// ==================================================================
DatePicker.prototype.setPosFromDates = function() {
    var lDate = this.els.cells.filter('[data-date="' + this.state.lDate + '"]'),
        rDate = this.els.cells.filter('[data-date="' + this.state.rDate + '"]');
        
    this.state.lHandle = lDate.index();
    this.state.rHandle = rDate.index();

    this.setHandlePos();
    this.setMiddlePos();
    this.setVPSelPos();
};
DatePicker.prototype.setDatesFromPos = function() {
    this.state.lDate = this.els.cells.eq(this.state.lHandle).data('date');
    this.state.rDate = this.els.cells.eq(this.state.rHandle).data('date');
};
DatePicker.prototype.setHandlePos = function() {
    this.els.lArea.css({ left: this.sizes.cell * this.state.lHandle + this.sizes.cell / 2 - this.sizes.calendar });
    this.els.rArea.css({ left: this.sizes.cell * this.state.rHandle + this.sizes.cell / 2 });
};
DatePicker.prototype.setMiddlePos = function() {
    this.els.mArea.css({
        width: this.sizes.cell * (this.state.rHandle - this.state.lHandle),
        left: this.sizes.cell * this.state.lHandle + this.sizes.cell / 2
    });
};
DatePicker.prototype.setVPSelPos = function() {
    var diff = this.state.rHandle - this.state.lHandle;
    
    this.els.vpsel.css({ width: this.sizes.monthq * diff, left: this.sizes.monthq * this.state.lHandle });
};
DatePicker.prototype.calSlide = function(pos) {
    var q = (this.sizes.calendar - this.sizes.wrap) / (this.sizes.wrap - this.sizes.viewport),
        x = Math.min(this.sizes.wrap - this.sizes.viewport, Math.max(0, pos));

    this.sizes.shift = -x * q;
    this.sizes.viewpos = x;

    this.els.calWrap.css({ left: this.sizes.shift });
    this.els.viewport.css({ left: this.sizes.viewpos });
};
DatePicker.prototype.setCalPos = function(pos) {
    var q = (this.sizes.wrap - this.sizes.viewport) / (this.sizes.calendar - this.sizes.wrap),
        x = Math.min(this.sizes.calendar - this.sizes.wrap, Math.max(0, pos));

    this.sizes.shift = -x;
    this.sizes.viewpos = x * q;

    this.els.calWrap.css({ left: this.sizes.shift });
    this.els.viewport.css({ left: this.sizes.viewpos });
};
DatePicker.prototype.calSlideLeft = function() {
    this.calSlide(this.sizes.viewpos - 1);
};
DatePicker.prototype.calSlideRight = function() {
    this.calSlide(this.sizes.viewpos + 1);    
};
DatePicker.prototype.dateToYMD = function(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
};
DatePicker.prototype.YMDToDate = function(ymd) {
    var darr = ymd.split('-');
    return new Date(+darr[0], +darr[1] - 1, +darr[2]);
};
