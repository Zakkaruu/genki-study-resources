// # MODIFICATIONS FOR ALL PAGES (<HEAD>) #
(function (window, document) {
  'use strict';
  
  // apply class to body for OS based fixes
  if (document.documentElement) {
    document.documentElement.className += /Linux/.test(window.navigator.platform) ? ' os-linux' : '';
  }
  
  // Global used for telling if the site is being used offline with MS Edge (pre-chromium).
  // Helps prevent "unspecified errors" caused by checking for the existence of localStorage support offline.
  window.offlineEdge = window.location.protocol == 'file:' && /Edge/.test(navigator.userAgent);
  
  // Global used for checking localStorage support (ex: storageOK && localStorage.myStorageItem)
  // prevents long winded conditions everytime we want to use storage
  window.storageOK = navigator.cookieEnabled && !offlineEdge && window.localStorage ? true : false;
  
  // # GENKI MODAL #
  // creates a modal or closes one
  window.GenkiModal = {
    
    // opens a new modal
    // params: object (optional)
    // {
    //           title : string, (popup title)
    //         content : string, (popup content)
    //      buttonText : string, (custom text for the OK button)
    // closeButtonText : string, (custom text for the close button)
    //         noFocus : bool, (keeps buttons from being focused)
    //           focus : string, (pass a css selector to focus a specific element; overrides noFocus)
    //      customSize : object, manually set the top, left, right, and bottom css properties
    //    customButton : string, add custom HTML to the button area
    //        keepOpen : bool, (keeps the modal open when clicking the callback button; useful for opening another modal afterwards)
    //         noClose : bool, (removes the close button)
    //          zIndex : 'low', lowers the z-index so the exercise menu can be used
    //        callback : function (function to execute when the OK button is clicked)
    //   closeCallback : function (function to execute when the close button is clicked)
    // } // all values are optional
    open : function (o) {
      o = o ? o : {};

      GenkiModal.close();

      // create the modal and set its params
      var modal = document.createElement('DIV'), button, buttons;
      modal.id = 'genki-modal';
      modal.innerHTML = 
      '<div id="genki-modal-overlay"' + ( o.zIndex == 'low' ? ' style="z-index:1;"' : '' ) + '></div>'+
      '<div id="genki-modal-body" style="' + ( o.zIndex == 'low' ? 'z-index:2;' : '' ) + ( o.customSize ? 'top:' + o.customSize.top + ';right:' + o.customSize.right + ';bottom:' + o.customSize.bottom + ';left:' + o.customSize.left + ';' : '' ) + '">'+
        '<h2 id="genki-modal-header">' + ( o.title ? o.title : 'Popup' ) + '</h2>'+
        '<div id="genki-modal-content">' + ( o.content ? o.content : '' ) + '</div>'+
        '<div id="genki-modal-buttons" class="center">'+
          (o.noClose ? '' : '<button id="genki-modal-close" class="button" onclick="GenkiModal.close();">' + (o.closeButtonText ? o.closeButtonText : 'Close') + '</button>')+
          (o.customButton ? o.customButton : '') +
        '</div>'+
      '</div>';

      // create a button for the callback function
      if (o.callback) {
        button = document.createElement('BUTTON');
        buttons = modal.querySelector('#genki-modal-buttons');

        // set button params
        button.innerText = o.buttonText ? o.buttonText : 'OK';
        button.id = 'genki-modal-ok';
        button.className = 'button';
        button.onclick = function () {
          o.callback();
          !o.keepOpen && GenkiModal.close();
        };

        // insert button into buttons list
        buttons.insertBefore(button, buttons.firstChild);
      }

      // add the modal to the document
      document.body.style.overflow = 'hidden';
      document.body.appendChild(modal);

      // focus confirm/ok button
      if (o.focus) {
        document.querySelector(o.focus).focus();
        
      } else if (!o.noFocus) {
        document.getElementById('genki-modal-' + (o.callback ? 'ok' : 'close')).focus();
      }
      
      // apply close button callback
      if (o.closeCallback) {
        document.getElementById('genki-modal-close').onclick = function () {
          o.closeCallback();
          !o.keepOpen && GenkiModal.close();
        };
      }

      // pause the timer when opening the modal
      if (window.Genki && Genki.timer && Genki.timer.isRunning()) {
        Genki.pauseTimerWhenOpenPopup();
      }
      
      return o;
    },

    // close the modal
    close : function () {
      var modal = document.getElementById('genki-modal');

      if (modal) {
        document.body.style.overflow = '';
        document.body.removeChild(modal);
      }

      // resume the timer when closing the modal
      if (window.Genki && Genki.timer && Genki.timer.isPaused()) {
        Genki.startTimerWhenClosePopup();
      }
    }
  };
  
  
  // # CUSTOM INPUTS #
  window.CreateCustomInputs = function () {
    for (var input = document.querySelectorAll('input[type="checkbox"], input[type="radio"]'), i = 0, j = input.length, type; i < j; i++) {
      if (!/light-switch-checkbox|genki_input_hidden/g.test(input[i].outerHTML)) { // exclusions
        input[i].className += ' genki_input_hidden';
        input[i].insertAdjacentHTML('afterend', '<span tabindex="0" class="genki_pseudo_' + input[i].type + '" onclick="this.previousSibling.click();" onkeypress="event.key == \'Enter\' && this.previousSibling.click();"/>');
      }
    }
  };
  
  
  // # JUMP ARROWS #
  // Add arrows to each target that return the student to the specified element
  window.AddJumpArrowsTo = function (targets, tag, title) {
    for (var a = document.querySelectorAll(targets), i = 0, j = a.length; i < j; i++) {
      a[i].insertAdjacentHTML('beforeEnd', '<a href="#' + (tag ? tag : '') + '" class="jump-arrow fa" title="' + (title ? title : '') + '">&#xf062;</a>');
    }
  };
  
  
  // # getPaths (helper function) #
  // finds out how deep a file is and returns a path that leads to the root
  // example: getPaths() + 'resources/css/stylesheet-dark.min.css'
  window.getPaths = function () {
    var path = window.location.pathname;
    
    if (/\/lessons\/|\/lessons-3rd\/.*?\//.test(path)) {
      return '../../../'
      
    } else if (/\/help\/.*?\//.test(path)) {
      return '../../'    
      
    } else if (/\/lessons-3rd\/|\/report\/|\/download\/|\/donate\/|\/privacy\/|\/help\/(index|$)/.test(path)) {
      return '../';  
               
    } else {
      return '';
    }
  };
  
  
  /* # SETTINGS MANAGER # */
  // functions for managing global site settings
  window.GenkiSettings = {
    manager : function () {
      // various settings and their selected||default values
      var fontSize = +localStorage.genkiFontSize || 100,
          pageWidth = +localStorage.genkiPageWidth || 100,
          genkiTheme = localStorage.genkiTheme || 'genki1',
          darkMode = localStorage.darkMode || 'off',
          adverts = localStorage.adverts || 'on',
          customCSS = localStorage.genkiCustomCSS || '',
          furigana = localStorage.furiganaVisible || 'true',
          spoilerMode = localStorage.spoilerMode || 'false',
          vocabHorizontal = localStorage.vocabHorizontal || 'false',
          feedbackMode = localStorage.feedbackMode || 'classic',
          randomExercise = localStorage.genkiRandomExercise || 'all',
          skipExType = localStorage.genkiSkipExType || 'false',
          jishoLookUp = localStorage.genkiJishoLookUp || 'true',
          strokeOrder = localStorage.strokeOrderVisible || 'true',
          tracingGuide = localStorage.tracingGuideVisible || 'true',
          timerAutoPause = localStorage.timerAutoPause || 'true',
          dataBackupReminder = localStorage.dataBackupReminder || 'true';
      
      // create stylesheet for settings
      if (!GenkiSettings.stylesheet) {
        GenkiSettings.createStylesheet();
      }
      
      // open settings popup
      GenkiModal.open({
        title : 'Settings Manager',
        content : '<p>You can manage your settings for Genki Study Resources in this window.<br>※ Please note that all data is saved locally to the browser, so clearing your browser\'s cache will reset your settings.</p>'+
        '<div class="section-title">Display</div>'+
        '<ul class="genki-settings-list">'+
          '<li>'+
            '<span class="label" title="Increases the font size for the site.">Font Size:</span>'+
            '<input id="font-size-range" type="range" min="100" max="500" value="' + fontSize + '" oninput="GenkiSettings.updateFontSize(this);" onchange="GenkiSettings.updateFontSize(this, true);"><span id="font-size-value">' + fontSize + '%</span>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Increases the maximum page width for the site (up to the size of your screen)">Page Width:</span>'+
            '<input id="page-width-range" type="range" min="100" max="500" value="' + pageWidth + '" oninput="GenkiSettings.updatePageWidth(this);" onchange="GenkiSettings.updatePageWidth(this, true);"><span id="page-width-value">' + pageWidth + '%</span>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Changes the main color of the website.">Theme:</span>'+
            '<select id="settings-theme" onchange="GenkiSettings.updateTheme(this);">'+
              '<option value="genki1"' + ( genkiTheme == 'genki1' ? ' selected' : '' ) + '>Genki I</option>'+
              '<option value="genki2"' + ( genkiTheme == 'genki2' ? ' selected' : '' ) + '>Genki II</option>'+
            '</select>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Enable or disable Dark Mode.">Dark Mode:</span>'+
            '<button id="settings-dark-mode" class="button' + (darkMode == 'on' ? '' : ' opt-off') + '" onclick="GenkiSettings.updateDarkMode(this);">' + (darkMode == 'on' ? 'ON' : 'OFF') + '</button>'+
          '</li>'+
        
          (window.location.protocol == 'file:' ? '' : '<li>'+
            '<span class="label" title="Enable or disable Ads.\nAds help support the developer, but if they\'re annoying or distracting, you can turn them off with this option.">Ads:</span>'+
            '<button id="settings-dark-mode" class="button' + (adverts == 'on' ? '' : ' opt-off') + '" onclick="GenkiSettings.updateAdverts(this);">' + (adverts == 'on' ? 'ON' : 'OFF') + '</button>'+
          '</li>')+
        
          '<li>'+
            '<span class="label" title="Use your own CSS to customize the design of the site to your liking">Custom CSS:<br><a href="https://www.w3schools.com/css/css_intro.asp" target="_blank" style="font-weight:normal;"><small>What is CSS?</small></a></span>'+
            '<textarea id="page-custom-css" oninput="GenkiSettings.updateCustomCSS(this, true);">' + customCSS + '</textarea>'+
          '</li>'+
        '</ul>'+
        
        '<div class="section-title">Exercises</div>'+
        '<ul class="genki-settings-list">'+
          '<li>'+
            '<span class="label" title="Enable or disable furigana (reading aid) for kanji.">Furigana:</span>'+
            '<button id="settings-furigana" class="button' + (furigana == 'true' ? '' : ' opt-off') + '" onclick="GenkiSettings.updateFurigana(this);">' + (furigana == 'true' ? 'ON' : 'OFF') + '</button>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Changes the orientation used for drag and drop vocabulary exercises (kana exercises are not affected)">Drag and Drop Mode:</span>'+
            '<select id="settings-vocab-mode" onchange="GenkiSettings.updateVocabMode(this);">'+
              '<option value="false"' + ( vocabHorizontal == 'false' ? ' selected' : '' ) + '>Vertical</option>'+
              '<option value="true"' + ( vocabHorizontal == 'true' ? ' selected' : '' ) + '>Horizontal</option>'+
            '</select>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Changes the feedback mode for multple choice quizzes.\nInstant shows if your answer was correct right away, whereas Classic only shows your answers at the end of the quiz.">Multiple Choice Feedback Mode:</span>'+
            '<select id="settings-feedback-mode" onchange="GenkiSettings.updateFeedbackMode(this);">'+
              '<option value="classic"' + ( feedbackMode == 'classic' ? ' selected' : '' ) + '>Classic</option>'+
              '<option value="instant"' + ( feedbackMode == 'instant' ? ' selected' : '' ) + '>Instant</option>'+
            '</select>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Hides the choices in multiple choice vocab exercises, similar to a flash card mode.\nTurn this mode on if you keep looking at the choices to remember what a word means instead of recalling it from memory.">Multiple Choice Vocab Spoiler:</span>'+
            '<button id="settings-vocab-spoiler" class="button' + (spoilerMode == 'true' ? '' : ' opt-off') + '" onclick="GenkiSettings.updateSpoilerMode(this);">' + (spoilerMode == 'true' ? 'ON' : 'OFF') + '</button>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Changes the range for the Random Exercise button in the exercise list (change to Current Lesson if you want to avoid exercises above your current level)">Random Exercise Range:</span>'+
            '<select id="random-exercise-type" onchange="GenkiSettings.updateRandomExercise(this);">'+
              '<option value="all"' + ( randomExercise == 'all' ? ' selected' : '' ) + '>All Lessons</option>'+
              '<option value="lesson"' + ( randomExercise == 'lesson' ? ' selected' : '' ) + '>Current Lesson</option>'+
              '<option value="completed"' + ( randomExercise == 'completed' ? ' selected' : '' ) + '>Practice Completed Exercises</option>'+
            '</select>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Skips that pesky exercise type selection prompt and instantly starts exercises when enabled. (3rd edition only; Partial 2nd ed. support)\nThe exercise type can still be changed manually via the Change Exercise Type button at the bottom of an exercise.">Skip Exercise Type Selection:</span>'+
            '<button id="settings-skip-ex-type" class="button' + (skipExType == 'true' ? '' : ' opt-off') + '" onclick="GenkiSettings.updateSkipExType(this);">' + (skipExType == 'true' ? 'ON' : 'OFF') + '</button>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Enable or disable the look up button that appears when you select texts. This feature may interfere with some IMEs, so it is recommended to disable it if you encounter any issues.">Quick Jisho Look Up:</span>'+
            '<button id="settings-jisho-lookup" class="button' + (jishoLookUp == 'true' ? '' : ' opt-off') + '" onclick="GenkiSettings.updateJishoLookUp(this);">' + (jishoLookUp == 'true' ? 'ON' : 'OFF') + '</button>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Enable or disable the stroke order display in stroke order exercises (3rd edition only)">Stroke Order:</span>'+
            '<button id="settings-stroke-order" class="button' + (strokeOrder == 'true' ? '' : ' opt-off') + '" onclick="GenkiSettings.updateStrokeOrder(this);">' + (strokeOrder == 'true' ? 'ON' : 'OFF') + '</button>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Enable or disable the tracing guide display in stroke order exercises (3rd edition only)">Tracing Guide:</span>'+
            '<button id="settings-tracing-guide" class="button' + (tracingGuide == 'true' ? '' : ' opt-off') + '" onclick="GenkiSettings.updateTracingGuide(this);">' + (tracingGuide == 'true' ? 'ON' : 'OFF') + '</button>'+
          '</li>'+

          '<li>'+
            '<span class="label" title="Enable or disable pausing timer when you leave or hide the exercise page">Pause Timer Automatically:</span>'+
            '<button id="settings-timer-auto-pause" class="button' + (timerAutoPause == 'true' ? '' : ' opt-off') + '" onclick="GenkiSettings.updateTimerAutoPause(this);">' + (timerAutoPause == 'true' ? 'ON' : 'OFF') + '</button>'+
          '</li>'+
        
          '<li>'+
            '<span class="label" title="Shows a reminder every 10 exercises to backup your exercise score data.">Exercise Data Backup Reminder:</span>'+
            '<button id="settings-data-backup-reminder" class="button' + (dataBackupReminder == 'true' ? '' : ' opt-off') + '" onclick="GenkiSettings.updateDataBackupReminder(this);">' + (dataBackupReminder == 'true' ? 'ON' : 'OFF') + '</button>'+
          '</li>'+

          '<li>'+
            '<span class="label" title="Save or load your exercise score data.\nThis data is stored locally in the browser, so it\'s highly recommended that you save your data periodically so you don\'t lose it.">Save/Load Exercise Score Data:</span>'+
            '<a id="settings-save-exercise-data" class="button" download="Genki Exercise Score Data" href="data:,' + (storageOK && localStorage.Results ? encodeURIComponent(localStorage.Results.replace(/\n/g, '\r\n')) : '') + '"><i class="fa">&#xf019;</i>Save</a>'+
            '<button id="settings-load-exercise-data" class="button" onclick="this.nextSibling.click();"><i class="fa">&#xf093;</i>Load</button><input id="settings-load-data" type="file" accept=".txt,.json,.js" onchange="GenkiSettings.loadExerciseData(this);" style="visibility:hidden;position:absolute;">'+
          '</li>'+
        '</ul>',

        buttonText : 'Close',
        noFocus : true,
        focus : '#font-size-range',
        
        customSize : {
          top : '5%',
          left : '10%',
          bottom : '5%',
          right : '10%'
        }
      });
    },
    
    
    // loads exercise score data
    loadExerciseData : function (input) {
      var file = input.files[0],
          reader = new FileReader();
      
      reader.onload = function (e) {
        if (/"3rd"\:|"2nd"\:/.test(e.target.result)) {
          localStorage.Results = e.target.result;
          
          alert('Exercise score data has been loaded successfully! Please reload the page to update your scores.');
          
        } else {
          alert('There was an error loading the exercise score data. Please try again or open a new issue on GitHub for help: https://github.com/SethClydesdale/genki-study-resources/issues');
        }
      };
      
      reader.readAsText(file, 'UTF-8');
    },
    
    
    // update button state for settings
    updateButton : function (caller, callback) {
      // switches button state to ON if it's off
      if (/opt-off/.test(caller.className)) {
        caller.innerText = 'ON';
        caller.className = caller.className.replace('opt-off', '');
        callback && callback('ON');
      }
      
      // switches button state to OFF if it's on
      else {
        caller.innerText = 'OFF';
        caller.className += ' opt-off';
        callback && callback('OFF');
      }
    },
    
    
    // updates the font size
    updateFontSize : function (caller, updateCSS) {
      var n = (caller ? +caller.value : localStorage.genkiFontSize) / 100;
      
      // update number value
      if (caller) caller.nextSibling.innerText = caller.value + '%';
      
      // update the CSS
      if (updateCSS) {
        var css = '/*FONT-SIZE-START*/'+
          // font size
          'footer li:before { font-size:' + (6 * n) + 'px }'+
          '.kana-quiz.quiz-over [data-mistakes]:after { font-size:' + (8 * n) + 'px }'+
          '.quiz-over .vocab-horizontal [data-mistakes]:after, .verb-quiz.quiz-over [data-mistakes]:after { font-size:' + (10 * n) + 'px }'+
          '.define, #announcement .announcement .date, #quick-search-results li[data-lesson]:before, .writing-quiz .quiz-item:before, .helper-present #question-list .quiz-item:before, .furigana, .inline-furi i, ruby rt, .secondary-answer, .def-ja.def-furi i { font-size:' + (11 * n) + 'px }'+
          '#exercise-title:after, .title[data-page]:after, #exercise-list li a[data-page]:hover:after, #exercise-list li a[data-page]:focus:after, .leg-desc, .sectionNumber3rd { font-size:' + (12 * n) + 'px }'+
          '.kanji-readings.drag-quiz .vocab-horizontal #question-list .quiz-answer-zone .quiz-item, .kanji-meanings.drag-quiz .vocab-horizontal #question-list .quiz-answer-zone .quiz-item, .image-list span i, .checkbox-label { font-size:' + (13 * n) + 'px }'+
          'body, p, input[type="text"], input[type="number"], textarea, select, #announcement .announcement, #link-list span, .workbook-title, .normal-block, .quiz-over [data-mistakes]:after, #wrongAnswer:before, .writing-quiz .quiz-item, input.writing-zone-input, .quiz-multi-question, .quiz-multi-answer, .text-block, .fill-quiz .writing-zone-input, .problem-hint, .problem-answer, .definition, .lesson-summary, #exercise-list .sub-lesson-title, .button:not(.play-button), a.button, #study-tool-settings li { font-size:' + (14 * n) + 'px }'+
          '#exercise-list .lesson-title, #genki-modal-content, .table.grammar-table td { font-size:' + (15 * n) + 'px }'+
          '#link-list i, #exercise:before, .loading:before, .sub-lesson-title, .workbook-title, .title-desc, #exercise .text-passage, #complete-banner, #downloadCode:before, .definition-count, .multi-vocab rt, .table-head { font-size:' + (16 * n) + 'px }'+
          '.group-selectors .select-all:before, .group-selectors .deselect-all:before { font-size:' + (17 * n) + 'px }'+
          '.button .fa, .more-exercises a:after, .more-exercises a:before, #link-github i, #link-help i, .title-med, .sub-title, #exercise-list .main-title, .quiz-multi-answer:before, #genki-site-settings, .dictionary-index li, #quick-jisho-title { font-size:' + (18 * n) + 'px }'+
          '#quick-actions h2, .lesson-title, .vocab-key:before { font-size:' + (20 * n) + 'px }'+
          '.section-title, #exercise-title, #break-timer, #announcement .fa, .multi-vocab-sentence { font-size:' + (24 * n) + 'px }'+
          '.kanji-readings.drag-quiz #question-list .quiz-item, .kanji-meanings.drag-quiz #question-list .quiz-item { font-size:' + (26 * n) + 'px }'+
          '.title { font-size:' + (28 * n) + 'px }'+
          '.multi-vocab { font-size:' + (32 * n) + 'px }'+
          // width
          '.slim-ruby ruby { width:' + (10 * n) + 'px }'+
          '.result-label { width:' + (150 * n) + 'px }'+
          '.kana-quiz .quiz-answer-zone:empty, .kana-quiz .quiz-item { width:' + (35 * n) + 'px }'+
          // height
          '.problem-hint, .problem-answer { height:' + (20 * n) + 'px }'+
          '#quiz-progress, #quiz-progress-bar { height:' + (25 * n) + 'px }'+
          '#genki-site-settings { height:' + (26 * n) + 'px }'+
          '.kanji-meanings.drag-quiz .vocab-horizontal #question-list .quiz-answer-zone .quiz-item, .drag-quiz .quiz-item, .drag-quiz .quiz-answer-zone { height:' + (28 * n) + 'px }'+
          '.vocab-key:before, .kana-quiz .quiz-answer-zone:empty, .kana-quiz .quiz-item { height:' + (30 * n) + 'px }'+
          '#genki-modal-buttons, #genki-modal-header { height:' + (40 * n) + 'px }'+
          '.kanji-meanings.drag-quiz .quiz-answer-zone, .kanji-meanings.drag-quiz #question-list .quiz-item, .kanji-meanings.drag-quiz #question-list .quiz-item, .kanji-meanings.drag-quiz .quiz-answer-zone, .kanji-readings.drag-quiz .quiz-answer-zone, .kanji-readings.drag-quiz .quiz-item { height:' + (48 * n) + 'px }'+
          '#announcement { height:' + (105 * n) + 'px }'+
          '#announcement .announcement { height:' + (70 * n) + 'px }'+
          '.multi-vocab { min-height:' + (64 * n) + 'px }'+
          // line-height
          '.secondary-answer { line-height:' + (10 * n) + 'px; }'+
          '#exercise-list li a[data-page]:focus:after, #exercise-list li a[data-page]:hover:after { line-height:' + (12 * n) + 'px; }'+
          '.writing-quiz .quiz-item:before, .helper-present #question-list .quiz-item:before { line-height:' + (15 * n) + 'px; }'+
          '.kanji-readings.drag-quiz .vocab-horizontal #question-list .quiz-answer-zone .quiz-item, .kanji-meanings.drag-quiz .vocab-horizontal #question-list .quiz-answer-zone .quiz-item, .drag-quiz .quiz-item, .drag-quiz .quiz-answer-zone, .problem-hint, .problem-answer { line-height:' + (20 * n) + 'px; }'+
          '.kana-quiz .quiz-answer-zone:empty, .kana-quiz .quiz-item { line-height:' + (22 * n) + 'px; }'+
          '#genki-site-settings, #quiz-progress-text { line-height:' + (26 * n) + 'px; }'+
          '#quick-jisho-title { line-height:' + (32 * n) + 'px; }'+
          '.vocab-key:before { line-height:' + (34 * n) + 'px; }'+
          '#genki-modal-buttons, #genki-modal-header { line-height:' + (40 * n) + 'px; }'+
          '.kanji-readings.drag-quiz #question-list .quiz-item, .kanji-meanings.drag-quiz #question-list .quiz-item { line-height:' + (44 * n) + 'px; }'+
          // padding
          '.vocab-key { padding-top:' + (30 * n) + 'px; }'+
          // margin
          '.writing-quiz .helper-present #question-list .quiz-item[data-helper] { margin-bottom:' + (3 * n) + 'px; }'+
          '.quiz-multi-answer.next-question:before { margin-top:-' + (9 * n) + 'px; }'+
          '.quiz-multi-answer:before { margin-top:-' + (10 * n) + 'px; }'+
          '.writing-quiz .quiz-answer-row.furi-row { margin-bottom:' + (12 * n) + 'px; }'+
          '.def-ja.def-furi { margin-bottom:' + (15 * n) + 'px; }'+
          '.vocab-horizontal.helper-present #question-list .quiz-item, .helper-present #question-list .quiz-item[data-helper], .helper-present #drop-list .quiz-answer-zone.helper-answer { margin-bottom:' + (18 * n) + 'px; }'+
          '.problem-hint, .problem-answer { margin-bottom:-' + (20 * n) + 'px; }'+
          '.fill-quiz .small-margin .block, .fill-quiz .small-margin .problem { margin-bottom:' + (25 * n) + 'px; }'+
          '.question-block { margin:' + (30 * n) + 'px 0; }'+
          '.fill-quiz .big-margin, .fill-quiz .example-problem, .fill-quiz .problem, .fill-quiz.quiz-over td .writing-zone { margin-bottom:' + (40 * n) + 'px; }'+
          // positioning
          '.kana-quiz .answer-correct .quiz-item:before { top:-' + (5 * n) + 'px; right:-' + (8 * n) + 'px; }'+
          '.writing-quiz .quiz-item:before, .helper-present #question-list .quiz-item:before, .def-ja.def-furi i { bottom:-' + (15 * n) + 'px }'+
          '.question-block:after { top:-' + (20 * n) + 'px }'+
          '.quiz-multi-answer:before { left:-' + (25 * n) + 'px }'+
          '#genki-modal-content { top:' + (40 * n) + 'px }'+
          '#genki-modal-content { bottom:' + (40 * n) + 'px }'+
          '#wrongAnswer:before { right:-' + (70 * n) + 'px }'+
          '.quiz-over [data-mistakes]:after { right:-' + (85 * n) + 'px }'+
          // bottom borders
          '.fill-quiz .writing-zone-input, .section-title, .lesson-title, #link-list a { border-bottom-width:' + ( 2 * n ) + 'px; }'+
          // modal position
          '#genki-modal-body { top:' + (10 / n) + '%; left:' + (25 / n) + '%; right:' + (25 / n) + '%; bottom:' + (40 / n) + '%; }'+
          // exercise list
          '#exercise-list { width:' + (300 * n) + 'px; left:-' + (301 * n) + 'px; }'+
          '#toggle-exercises.list-open { left:' + ((300 * n) - 30) + 'px; }'+
          // quick jisho
          '#quick-jisho-window { height:' + ( 300 * n ) + 'px; width:' + ( 500 * n ) + 'px; }'+
          '#quick-jisho-window.quick-jisho-hidden { bottom:-' + (310 * n) + 'px; }'+
          '#quick-jisho-results { height:' + (219 * n) + 'px; }'+
          '#quick-jisho-search { height:' + (35 * n) + 'px; }'+
          '.quick-jisho-row, #quick-jisho-results { padding:' + (3 * n) + 'px; }'+
          '#quick-jisho-selector { border-radius:' + (15 * n) + 'px; }'+
          // quick nav sub-section buttons
          '#quick-nav-list a.sub-section-button { font-size:' + ( 11 * n ) + 'px; height:' + ( 18 * n ) + 'px; width:' + ( 18 * n ) + 'px; line-height:' + ( 20 * n ) + 'px; left:-' + ( 22 * n ) + 'px; }'+
          '#quick-nav-list li:before { height:' + ( 6 * n ) + 'px; width:' + ( 6 * n ) + 'px; left:-' + ( 16 * n ) + 'px; }'+
          '#quick-nav-list li ul li:before { height:' + ( 4 * n ) + 'px; width:' + ( 4 * n ) + 'px; }'+
          // play buttons
          '.button.play-button { height:' + ( 25 * n ) + 'px; width:' + ( 25 * n ) + 'px; }'+
          '.button.play-button i { font-size:' + ( 14 * n ) + 'px; }'+
          // example
          '.example-problem:before { font-size:' + ( 12 * n ) + 'px; line-height:' + ( 12 * n ) + 'px; padding:' + ( 2 * n ) + 'px; border-radius:' + ( 5 * n ) + 'px; }'+
          '.example-problem.inline-columns { padding-left:' + ( 62 * n ) + 'px; }'+
          // furigana (disabled; reason: 10/25/2020 furigana update)
          //'ruby { bottom:-' + ( 16 * n ) + 'px; margin:-' + ( 16 * n ) + 'px 0 ' + ( 16 * n ) + 'px 0 }'+
          //'ruby rt { height:' + ( 15 * n ) + 'px; line-height:' + ( 15 * n ) + 'px; margin-top:-' + ( 1 * n ) + 'px; }'+
          // section numbers/icons
          '.sectionNumber3rd, .section-number { width:' + ( 22 * n ) + 'px; height:' + ( 22 * n ) + 'px; line-height:' + ( 21 * n ) + 'px; }'+
          // info icon
          '#quiz-info { padding:' + ( 15 * n ) + 'px ' + ( 15 * n ) + 'px ' + ( 15 * n ) + 'px ' + ( 50 * n ) + 'px; }'+
          '#quiz-info:before { font-size:' + ( 32 * n ) + 'px; margin-top:-' + ( 16 * n ) + 'px; left:' + ( 12 * n ) + 'px; }'+
          // announcement controls
          '#announcement .announce-controls { margin-top:-' + ( 15 * n ) + 'px; height:' + ( 30 * n ) + 'px; width:' + ( 20 * n ) + 'px; }'+
          '#announcement .announce-controls i.fa { font-size:' + ( 18 * n ) + 'px; line-height:' + ( 26 * n ) + 'px; }'+
          '#announcement .announce-controls.button-left { left:-' + ( 20 * n ) + 'px; }'+
          '#announcement .announce-controls.button-right { right:-' + ( 20 * n ) + 'px; }'+
          '#announce-list { margin:0 ' + ( 20 * n ) + 'px; }'+
          // overrides
          '.drawing-quiz .stroke-order-button, .dictionary-group .group-selectors .button, .dict-search-wrapper .group-selectors .button, .button.icon-only, .kanji-stroke-order, .kanji-stroke-order .button, .drawing-zone { font-size:13px }'+
          '.dictionary-group .group-selectors .deselect-all:before, .dictionary-group .group-selectors .select-all:before, .dict-search-wrapper .group-selectors .deselect-all:before, .dict-search-wrapper .group-selectors .select-all:before { font-size:17px }'+
          '.button.icon-only .fa, #random-exercise i { font-size:18px }'+
        '/*FONT-SIZE-END*/';
        
        // replace old css rules
        if (/\/\*FONT-SIZE-START\*\//.test(GenkiSettings.stylesheet.innerText)) {
          GenkiSettings.stylesheet.innerText = GenkiSettings.stylesheet.innerText.replace(/\/\*FONT-SIZE-START\*\/.*?\/\*FONT-SIZE-END\*\//, css);
        }

        // add new css rules
        else {
          GenkiSettings.stylesheet.innerText += css;
        }
        
        // update the width of input elements
        if (caller) { // if caller is not present, CSS was updated on page load, thus the following elements are null
          for (var input = document.querySelectorAll('[data-default-width]'), i = 0, j = input.length; i < j; i++) {
            input[i].style.width = (input[i].dataset.defaultWidth * n) + 'px';
          }
        }
      }
      
      // save setting to localStorage
      if (caller) localStorage.genkiFontSize = caller.value;
    },
    
    
    // updates the page width
    updatePageWidth : function (caller, updateCSS) {
      var n = (caller ? +caller.value : localStorage.genkiPageWidth) / 100;
      
      // update number value
      if (caller) caller.nextSibling.innerText = caller.value + '%';
      
      // update the CSS
      if (updateCSS) {
        var css = '/*PAGE-WIDTH-START*/'+
          '.content-block, #announce-inner { max-width:' + (1000 * n) + 'px }'+
        '/*PAGE-WIDTH-END*/';
        
        // replace old css rules
        if (/\/\*PAGE-WIDTH-START\*\//.test(GenkiSettings.stylesheet.innerText)) {
          GenkiSettings.stylesheet.innerText = GenkiSettings.stylesheet.innerText.replace(/\/\*PAGE-WIDTH-START\*\/.*?\/\*PAGE-WIDTH-END\*\//, css);
        } 
        
        // add new css rules
        else {
          GenkiSettings.stylesheet.innerText += css;
        }
      }
      
      // save setting to localStorage
      if (caller) localStorage.genkiPageWidth = caller.value;
    },
    
    
    // updates theme state
    updateTheme : function (caller) {
      var theme = document.getElementById('website-theme');
      
      // remove current theme
      if (theme) {
        theme.parentNode.removeChild(theme);
      }
      
      // apply new theme
      if (caller.value != 'genki1') {
        var theme = document.createElement('LINK');
        theme.id = 'website-theme';
        theme.href = getPaths() + 'resources/css/theme-' + caller.value + '.min.css';
        theme.rel = 'stylesheet';
        document.head.appendChild(theme);
      }
      
      // save preference to cache
      if (storageOK) {
        localStorage.genkiTheme = caller.value;
      }
    },
    
    
    // updates dark mode state
    updateDarkMode : function (caller) {
      document.getElementById('light-switch-checkbox').click();
      GenkiSettings.updateButton(caller);
    },
    
    
    // updates adverts state
    updateAdverts : function (caller) {
      GenkiSettings.updateButton(caller, function (state) {
        localStorage.adverts = state == 'ON' ? 'on' : 'off';
        
        GenkiModal.open({
          title : 'Reload Required',
          content : 'The page needs to be reloaded for this setting to take effect. Do you want to reload now?',
          buttonText : 'Reload',
          closeButtonText : 'Return to Settings',
          
          callback : function () {
            window.location.reload();
          },
          
          closeCallback : function () {
            setTimeout(GenkiSettings.manager, 10);
          }
        });
      });
    },
    
    
    // updates custom css
    updateCustomCSS : function (caller, updateCSS) {
      // update the CSS
      if (updateCSS) {
        var css = '/*CUSTOM-CSS-START*/' + (caller ? caller.value : localStorage.genkiCustomCSS) + '/*CUSTOM-CSS-END*/';
        
        // replace old css rules
        if (/\/\*CUSTOM-CSS-START\*\//.test(GenkiSettings.stylesheet.innerText)) {
          GenkiSettings.stylesheet.innerText = GenkiSettings.stylesheet.innerText.replace(/\/\*CUSTOM-CSS-START\*\/.*?\/\*CUSTOM-CSS-END\*\//, css);
        } 
        
        // add new css rules
        else {
          GenkiSettings.stylesheet.innerText += css;
        }
      }
      
      // save setting to localStorage
      if (caller) localStorage.genkiCustomCSS = caller.value;
    },
    
    
    // updates the feedback mode preference
    updateFeedbackMode : function (caller) {
      if (caller) {
        localStorage.feedbackMode = caller.value;
        
        if (window.Genki && Genki.feedbackMode) {
          Genki.feedbackMode = caller.value;
        }
        
        // toggle display state of the next button
        var next = document.getElementById('next-button');
        
        if (next) {
          // automatically proceed to next question if the student answered while in instant mode and switched to classic mode
          if (Genki.feedbackMode == 'classic' && /visible/.test(next.style.visibility)) {
            next.firstChild.click();
          }
          
          next.style.display = Genki.feedbackMode == 'classic' ? 'none' : '';
        }
      }
    },
    
    
    // updates the random exercise preference
    updateRandomExercise : function (caller) {
      if (caller) localStorage.genkiRandomExercise = caller.value;
    },
    
    
    // updates vocab spoiler preference
    updateSpoilerMode : function (caller) {
      GenkiSettings.updateButton(caller, function (state) {

        if (document.querySelector('.vocab-spoiler')) {
          var zone = document.getElementById('quiz-zone');

          if (state == 'ON') {
            zone.className += ' spoiler-mode';
          } else {
            zone.className = zone.className.replace('spoiler-mode', '');
          }
        }

        localStorage.spoilerMode = state == 'ON' ? 'true' : 'false';
      });
    },
    
    
    // updates furigana preference
    updateFurigana : function (caller) {
      GenkiSettings.updateButton(caller, function (state) {
        var button = document.getElementById('toggle-furigana');

        // update preferences by clicking the button if it's present
        if (button) {
          button.click();
        }
        
        // otherwise manually update the localStorage preference
        else {
          localStorage.furiganaVisible = state == 'ON' ? 'true' : 'false';
        }
      });
    },
    
    
    // updates furigana preference
    updateVocabMode : function (caller) {
      var button = document.getElementById('toggle-orientation');

      // update preferences by clicking the button if it's present
      if (button) {
        button.click();
      }

      // otherwise manually update the localStorage preference
      else {
        localStorage.vocabHorizontal = caller.value;
      }
    },

    
    // updates exercise type selection skipping preference
    updateSkipExType : function (caller) {
      GenkiSettings.updateButton(caller, function (state) {
        localStorage.genkiSkipExType = state == 'ON' ? 'true' : 'false';
      });
    },

    
    // updates exercise type selection skipping preference
    updateJishoLookUp : function (caller) {
      GenkiSettings.updateButton(caller, function (state) {
        localStorage.genkiJishoLookUp = state == 'ON' ? 'true' : 'false';
      });
    },

    
    // updates stroke order preference
    updateStrokeOrder : function (caller) {
      GenkiSettings.updateButton(caller, function (state) {
        var button = document.getElementById('toggle-stroke-order');

        // update preferences by clicking the button if it's present
        if (button) {
          button.click();
        }
        
        // otherwise manually update the localStorage preference
        else {
          localStorage.strokeOrderVisible = state == 'ON' ? 'true' : 'false';
        }
      });
    },

    
    // updates stroke order preference
    updateTracingGuide : function (caller) {
      GenkiSettings.updateButton(caller, function (state) {
        var button = document.getElementById('toggle-tracing-guide');

        // update preferences by clicking the button if it's present
        if (button) {
          button.click();
        }
        
        // otherwise manually update the localStorage preference
        else {
          localStorage.tracingGuideVisible = state == 'ON' ? 'true' : 'false';
        }
      });
    },
    
    // updates data backup reminder
    updateDataBackupReminder : function (caller) {
      GenkiSettings.updateButton(caller, function (state) {
        localStorage.dataBackupReminder = state == 'ON' ? 'true' : 'false';
      });
    },

    // updates timer auto pause preference
    updateTimerAutoPause : function (caller) {
      GenkiSettings.updateButton(caller, function (state) {
        localStorage.timerAutoPause = state == 'ON' ? 'true' : 'false';

        if (state == 'ON') {
          document.addEventListener("visibilitychange", Genki.startOrPauseTimerByVisibility);
        } else {
          document.removeEventListener("visibilitychange", Genki.startOrPauseTimerByVisibility);
        }
      });
    },
    
    // creates the global settings stylesheet
    createStylesheet : function () {
      if (!GenkiSettings.stylesheet) {
        GenkiSettings.stylesheet = document.createElement('STYLE');
        GenkiSettings.stylesheet.type = 'text/css';

        // append stylesheet to the document
        document.getElementsByTagName('HEAD')[0].appendChild(GenkiSettings.stylesheet);
      }
    }
  };
  
  // apply global settings on page load
  if (storageOK) {
    GenkiSettings.createStylesheet();
    
    // applies settings while the page is still loading, so long as they're not their default values
    // apply selected font size
    if (localStorage.genkiFontSize && localStorage.genkiFontSize != '100') {
      GenkiSettings.updateFontSize(false, true);
    }
    
    // apply selected page width
    if (localStorage.genkiPageWidth && localStorage.genkiPageWidth != '100') {
      GenkiSettings.updatePageWidth(false, true);
    }
    
    // apply custom CSS
    if (localStorage.genkiCustomCSS && localStorage.genkiCustomCSS != '') {
      GenkiSettings.updateCustomCSS(false, true);
    }
  }
  
  
  // # DARK MODE #
  // applies the dark mode theme on page load
  if (storageOK) {
    // automatically enables dark mode (once) based on the user's preferences
    if (!localStorage.darkMode && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      localStorage.darkMode = 'on';
    }

    // applies the dark mode theme on page load
    if (localStorage.darkMode == 'on') {
      document.write('<link id="dark-mode" href="' + getPaths() + 'resources/css/stylesheet-dark.min.css" rel="stylesheet">');
      document.documentElement.className += ' dark-mode';
    }
  }
  
  
  // # THEME #
  // applies the selected theme on page load
  if (storageOK) {
    if (localStorage.genkiTheme && localStorage.genkiTheme != 'genki1') {
      document.write('<link id="website-theme" href="' + getPaths() + 'resources/css/theme-' + localStorage.genkiTheme + '.min.css" rel="stylesheet">');
    }
  }
  
  
  // # FONT PRE-LOADING #
  // pre-loads fonts for kanji canvases
  window.preLoadFonts = function () {
    // function used to redraw canvases once the font is loaded
    var redraw = function () {
      if (window.KanjiCanvas) {
        for (var a = document.querySelectorAll('.kanji-canvas'), i = 0, j = a.length; i < j; i++) {
          if (KanjiCanvas['canvas_' + a[i].id]) {
            KanjiCanvas.redraw(a[i].id, true);
          }
        }
      }
    };
    
    // loop through arguments to form @font-face rules and apply events for loading fonts
    for (var a = arguments, i = 0, j = arguments.length, styles = '', fonts = '', font; i < j; i++) {
      font = a[i].replace(/\..*?$/, '');
      fonts += font + (i == j - 1 ? '' : ', ');
      styles += 
        '@font-face {'+
          'font-family:"' + font + '";'+
          'src:url(' + getPaths() + 'resources/fonts/' + a[i] + ') format("' + (/otf/.test(a[i]) ? 'opentype' : /ttf/ ? 'truetype' : '') + '");'+
        '}\n';
    }
    
    // apply @font-face rules to the document
    document.write('<style>' + styles + '</style>');
    
    // load and render fonts
    if (document.fonts && document.fonts.load) {
      document.fonts.load('10px ' + fonts).then(redraw);
    } 
    // fallback
    else {
      document.write('<span style="font-family:' + fonts + ';opacity:0;position:absolute;font-size:0;height:0;width:0;">' + fonts + '</span>');
      window.setTimeout(redraw, 1500);
    }
  };
  
  
  // # LIMITED MODE WARNING #
  // If cookies are blocked, Genki Study Resources will run in limited mode. Settings are not remembered in this mode and certain features, such as dark mode, are unavailable.
  if (!navigator.cookieEnabled) {
    console.warn('Cookies are not available either due to host or browser settings. Genki Study Resources will function in limited mode where settings are not remembered and certain features are unavailable. This issue can commonly be resolved by enabling third-party cookies. Please see the following page for help.\nhttps://sethclydesdale.github.io/genki-study-resources/help/stuck-loading/\n\nIf the issue still occurs after enabling third-party cookies, please contact the developer for further assistance.\nhttps://github.com/SethClydesdale/genki-study-resources/issues');
  }
  
  
  // AJAX page getter
  window.Get = function (url, callback, type) {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        callback(this.response); // callback on success
      }
    };

    // set response type
    if (typeof type != 'undefined') {
      xhttp.responseType = type;
    }

    // open and send the request
    xhttp.open('get', url, true);
    xhttp.send();

    return xhttp;
  };
  
}(window, document));