/////////////////////////////////////////////////////////////////////////////
// YAPF - Yet another PageFlip effect
// (c) 2014 by Das PeTe
//////////////////////////////////////////////////////////////////////////


// UMD PATTERN
(function (root, factory) {
    if (typeof define === "function" && define.amd) { // AMD ready
        define(['jquery', 'greensock'], factory);
    }else if(typeof exports === 'object'){
        module.exports=factory(require('jquery'), require('greensock'));
    }else{ // NO-AMD
        root.PageFlip=factory(root.$, root.TweenMax);
    }
}(this, function ($){
// END UMD PATTERN
    // PageFlip Constructor
    function PageFlip(settings){
        
        // default settings
        var defaults={
            container: '.page-container',
            
            effect: 'flip', // flip or slide
            shadow: true,
            flipTime: 3000,

            height: '100%',
            zIndex: 10000,
            
            loop: true,

            keyboard: true,
            keys: {
                left: 37,
                right: 39
            },

            nextButton:'.btn-next',
            prevButton:'.btn-prev',

            mouse: true,
            startOffset: 8,
            slideWidth: 300,

            currentFlipClass: 'currentFlip',
            flipContainerClass: 'flipContainer',
            flipContentClass: 'flipContent',
            workingFlipClass: 'workingFlip',
            frontClass: 'front',
            backClass: 'back',
            flippingClass: 'flipping',
            backFlippingClass: 'backFlipping',
            emptyFlipClass: 'flipEmpty',
            leftContentClass: 'leftFlipContent',
            rightContentClass: 'rightFlipContent',
            halfContentClass: 'splitHalf',
            shadowClass: 'flipShadow'
        };
        
        // PageFlip MainModule
        var pageFlip={
            settings: {},
            environment:{},
            DOM: {},

            firstHalf: 1,
            secondHalf: -1,

            isAnimating: false,

            flipPosition: null,
            flipSide: null,

            userContext: {
                position:null,
                downTime:null,
                history:null,
                flipSide:null,
                $containers:null
            },

            
            init: function(settings, defaults){
                var that=this;

                $.extend(this.settings, defaults, settings);

                this.getEnvironment();
                this.setup();
            },

            setup: function(){
                var that=this;

                this.DOM.$nextButton=$(this.settings.nextButton);
                this.DOM.$prevButton=$(this.settings.prevButton);

                this.DOM.$root=$(this.settings.container);

                this.DOM.$root.find('img').each(function(i,img){
                    $(img).on(events.mousedown, function(e){
                        e.preventDefault();
                    });
                });

                this.DOM.$root.addClass(this.settings.flipContainerClass);
                this.DOM.$root.height(this.settings.height);
                
                this.DOM.$root.children('div, p, section').each(function(i, child){
                    $(child).addClass(that.settings.flipContentClass);
                    $(child).height(that.settings.height);
                });

                var $current=this.DOM.$root.children('.'+this.settings.currentFlipClass);
                if($current.length === 0){
                    this.DOM.$root.children().eq(0).addClass(this.settings.currentFlipClass);
                }

                this.setMouseEventListeners();    
            },

            initShadow: function($containers){
                $leftFrontShadow=$('<div></div>');
                $leftFrontShadow.addClass(this.settings.shadowClass);

                $rightFrontShadow=$('<div></div>');
                $rightFrontShadow.addClass(this.settings.shadowClass);

                this.createShadow($leftFrontShadow);
                this.createShadow($rightFrontShadow);

                $containers.left.append($leftFrontShadow);
                $containers.right.append($rightFrontShadow);

                return $containers;
            },
            createShadow: function($container){
                $container.width('100%');
                $container.height('100%');
                $container.css({
                    position: 'absolute',
                    overflow: 'hidden',
                    top: 0,
                    left: 0
                });
            },
            updateShadows: function(rotation){
                $frontLeftShadow=$('.front'+this.settings.leftContentClass).children('.'+this.settings.shadowClass);
                $frontRightShadow=$('.front'+this.settings.rightContentClass).children('.'+this.settings.shadowClass);
                $backLeftShadow=$('.back'+this.settings.leftContentClass).children('.'+this.settings.shadowClass);
                $backRightShadow=$('.back'+this.settings.rightContentClass).children('.'+this.settings.shadowClass);

                var percent=rotation / 90;
                var origPercent=0;

                var backShadowDecrease=0;
                
                var startFrontShadowAt=0.4;
                var fixBackShadowAt=0.88;

                var frontLeftValue=0;
                var frontRightValue=0;
                var backLeftValue=0;
                var backRightValue=0;

                var firstSideFactor=2;
                var secondSideFactor=3;
                var backSideFactor=5;

                var shadowDecreaseFactor=0.2;
                var secondSideBackFactor=0.3;


                if(this.flipSide === this.secondHalf){
                    if(percent < 1){
                        if(percent >= startFrontShadowAt){
                            frontRightValue=100*(percent-startFrontShadowAt)*firstSideFactor;
                            frontLeftValue=100*(percent-startFrontShadowAt)*secondSideFactor;
                        }

                        if(percent < fixBackShadowAt){
                            backRightValue=100*(1-percent)*backSideFactor;
                        }else{
                            backRightValue=100*(1-fixBackShadowAt)*backSideFactor;
                        }
                    }else{
                        origPercent=percent;
                        percent=1-(percent-1);

                        if(percent < fixBackShadowAt){
                            backShadowDecrease=fixBackShadowAt+(fixBackShadowAt-percent)*shadowDecreaseFactor;
                            backRightValue=100*(1-backShadowDecrease)*backSideFactor;
                        }else{
                            backRightValue=100*(1-fixBackShadowAt)*backSideFactor;
                        }

                        backLeftValue=100*(percent-secondSideBackFactor);

                        frontLeftValue=100*((origPercent)-startFrontShadowAt)*secondSideFactor;
                    }    
                }else{
                    if(percent < 1){
                        if(percent >= startFrontShadowAt){
                            frontLeftValue=100*(percent-startFrontShadowAt)*firstSideFactor;
                            frontRightValue=100*(percent-startFrontShadowAt)*secondSideFactor;
                        }

                        if(percent < fixBackShadowAt){
                            backLeftValue=100*(1-percent)*backSideFactor;
                        }else{
                            backLeftValue=100*(1-fixBackShadowAt)*backSideFactor;
                        }
                    }else{
                        origPercent=percent;
                        percent=1-(percent-1);

                        if(percent < fixBackShadowAt){
                            backShadowDecrease=fixBackShadowAt+(fixBackShadowAt-percent)*shadowDecreaseFactor;
                            backLeftValue=100*(1-backShadowDecrease)*backSideFactor;
                        }else{
                            backLeftValue=100*(1-fixBackShadowAt)*backSideFactor;
                        }

                        backRightValue=100*(percent-secondSideBackFactor);

                        frontRightValue=100*((origPercent)-startFrontShadowAt)*secondSideFactor;
                    }
                }

                this.setShadowGradient($frontLeftShadow, frontLeftValue, 'to left', 0.5);
                this.setShadowGradient($frontRightShadow, frontRightValue, 'to right', 0.5);

                this.setShadowGradient($backLeftShadow, backLeftValue, 'to left', 0.5);
                this.setShadowGradient($backRightShadow, backRightValue, 'to right', 0.5);
            },
            setShadowGradient: function($container, val, direction, maxOpacity){
                var linearGradientKey=this.environment.prefix.css+"linear-gradient";
                var gradientVal='('+direction+', rgba(0,0,0,'+maxOpacity+') 0%, rgba(0,0,0,0) '+(val)+'%)';

                $container.css({ background: linearGradientKey+gradientVal });
                $container.css({ background: 'linear-gradient'+gradientVal });
            },

            startFlip: function(flipSide){
                if(this.flipPosition !== null){
                    return;
                }

                this.flipSide=flipSide;
                this.flipPosition=0;

                this.doTheFlip(this.getFlipSides());
            },
            startManualFlip: function(flipSide){
                console.log("startManualFlip");
                if(this.flipPosition !== null){
                    return;
                }

                this.flipSide=flipSide;
                this.flipPosition=0;

                this.doTheManualFlip(this.getFlipSides());
            },
            getFlipSides: function(){
                var $current=this.DOM.$root.children('.'+this.settings.currentFlipClass);
                var $underlying=null;

                if(this.flipSide === this.secondHalf){
                    $underlying=this.getNextContent($current);
                }else{
                    $underlying=this.getPrevContent($current);
                }

                var back=this.splitContent($underlying, 'back');
                var front=this.splitContent($current, 'front');

                if(this.flipSide === this.secondHalf){
                    $front=front.right;
                    $back=back.left;
                }else{
                    $front=front.left;
                    $back=back.right;
                }

                $front.css({ zIndex: this.settings.zIndex+1 });
                $front.addClass(this.settings.flippingClass);

                $back.css({ zIndex: this.settings.zIndex });
                $back.addClass(this.settings.backFlippingClass);

                $current=this.DOM.$root.children('.'+this.settings.currentFlipClass);
                $current.removeClass(this.settings.currentFlipClass);
                $current.addClass(this.settings.workingFlipClass);

                return {
                    front: $front,
                    back: $back
                };
            },
            flipStep: function(rotation, $containers){
                var $working=this.DOM.$root.children('.'+this.settings.workingFlipClass);
                if($working.length === 0){
                    return;
                }

                $front=$containers.front;
                $back=$containers.back;

                var transformKey=this.environment.prefix.css+'transform';

                $front.css(transformKey, this.calcFrontRotation(rotation));
                $back.css(transformKey, this.calcBackRotation(rotation));

                if(rotation > 90){
                    $front.css({ zIndex: this.settings.zIndex });
                    $back.css({ zIndex: this.settings.zIndex+1 });

                    if($back.css('display') === 'none'){
                        $back.css({ display: 'block' });
                        $front.css({ display: 'none' });
                    }
                }else{
                    $front.css({ zIndex: this.settings.zIndex+1 });
                    $back.css({ zIndex: this.settings.zIndex });

                    if($front.css('display') === 'none'){
                        $front.css({ display: 'block' });
                        $back.css({ display: 'none' });
                    }
                }

                this.updateShadows(rotation);
            },
            doTheFlip: function($containers){
                var that=this;
                var tween={ rotation: 0 };

                this.isAnimating=true;

                TweenMax.to(tween, this.settings.flipTime/1000, {
                    rotation: 180,
                    ease: Power2.easeInOut,
                    onUpdate: function(){
                        that.flipStep(tween.rotation, $containers);
                    },
                    onComplete: function(){
                        that.cleanup();
                    }
                });
            },
            doTheManualFlip: function($containers){
                var that=this;

                this.userContext.$containers=$containers;
            },
            endFlipAnimation: function(rotation){
                var that=this;
                var tween={ rotation: rotation };
                var tweenTime=0;

                if(rotation < 90){
                    tweenTime=((rotation / 180) * this.settings.flipTime) / 1000;    
                }else{
                    tweenTime=(((180-rotation) / 180) * this.settings.flipTime) / 1000;    
                }

                this.isAnimating=true;

                TweenMax.to(tween, tweenTime, {
                    rotation: (rotation > 90)?180:0,
                    ease: Power2.easeOut,
                    onUpdate: function(){
                        that.flipStep(tween.rotation, that.userContext.$containers);
                    },
                    onComplete: function(){
                        if(rotation < 90){
                            that.cleanup(true);    
                        }else{
                            that.cleanup();
                        }
                    }
                });
            },

            flipNext: function(){
                if(this.flipSide !== null){
                    return;
                }

                var $current=this.DOM.$root.children('.'+this.currentFlipClass);
                var $next=this.getNextContent($current);

                if($next.length > 0){
                    this.userContext.flipSide=this.secondHalf;
                    this.startFlip(this.userContext.flipSide);
                }
            },
            flipPrev: function(){
                if(this.flipSide !== null){
                    return;
                }

                var $current=this.DOM.$root.children('.'+this.currentFlipClass);
                var $prev=this.getPrevContent($current);

                if($prev.length > 0){
                    this.userContext.flipSide=this.firstHalf;
                    this.startFlip(this.userContext.flipSide);
                }
            },

            calcFrontRotation: function(rotation){
                if(this.flipSide === this.firstHalf){
                    return 'rotateY('+(rotation)+'deg)';
                }else{
                    return 'rotateY('+(-rotation)+'deg)';    
                }
            },
            calcBackRotation: function(rotation){
                if(this.flipSide === this.firstHalf){
                    return 'rotateY('+(180+rotation)+'deg)';
                }else{
                    return 'rotateY('+(180-rotation)+'deg)';    
                }
            },

            cleanup: function(before){
                $current=this.DOM.$root.children('.'+this.settings.workingFlipClass);
                
                $('.'+this.settings.halfContentClass).remove();

                var $next=$current;

                if(typeof before === 'undefined'){
                    if(this.flipSide === this.secondHalf){
                        $next=this.getNextContent($current);
                    }else{
                        $next=this.getPrevContent($current);
                    }    
                }

                $next.addClass(this.settings.currentFlipClass);

                if(typeof before === 'undefined'){
                    $current.removeClass(this.settings.workingFlipClass);
                }

                this.isAnimating=false;
                this.flipSide=null;
                this.flipPosition=null;

                this.resetUserContext();
            },

            getNextContent: function($current){
                var $next=$current.next('.'+this.settings.flipContentClass);
                if($next.length === 0 && this.settings.loop === true){
                    $next=this.DOM.$root.children('.'+this.settings.flipContentClass).first();
                }

                return ($next.length === 0)? $() : $next;
            },
            getPrevContent: function($current){
                var $prev=$current.prev('.'+this.settings.flipContentClass);
                if($prev.length === 0 && this.settings.loop === true){
                    $prev=this.DOM.$root.children('.'+this.settings.flipContentClass).last();
                }

                return ($prev.length === 0)? $() : $prev;
            },

            splitContent: function($content, customClass){
                var $leftHalf=this.DOM.$root.children(customClass+this.settings.leftContentClass);
                var $rightHalf=this.DOM.$root.children(customClass+this.settings.rightContentClass);

                var rootWidth=this.DOM.$root.width();
                var rootHeight=this.DOM.$root.height();


                if($content === null || $content.length === 0){
                    $content=$('<div class="'+this.settings.emptyFlipClass+'"></div>');
                    $content.width(rootWidth);
                    $content.height(rootHeight);
                }

                if($leftHalf.length === 0){
                    $leftHalf=$('<div></div>');
                    $leftHalf.addClass(this.settings.halfContentClass);
                    $leftHalf.addClass(this.settings.leftContentClass);
                    $leftHalf.addClass(customClass+this.settings.leftContentClass);
                }else{
                    $leftHalf.empty();
                }

                if($rightHalf.length === 0){
                    $rightHalf=$('<div></div>');
                    $rightHalf.addClass(this.settings.halfContentClass);
                    $rightHalf.addClass(this.settings.rightContentClass);
                    $rightHalf.addClass(customClass+this.settings.rightContentClass);
                }else{
                    $rightHalf.empty();
                }

                $leftHalf.css({ zIndex: this.settings.zIndex });
                $rightHalf.css({ zIndex: this.settings.zIndex });

                $leftHalf.append($content.clone());
                $rightHalf.append($content.clone());

                $leftHalf.find('a').each(function(i,a){
                    $(a).on('click', function(e){
                        return false;
                    });
                });
                $rightHalf.find('a').each(function(i,a){
                    $(a).on('click', function(e){
                        return false;
                    });
                });

                $leftHalf.width(rootWidth/2);
                $leftHalf.height(rootHeight);
                $leftHalf.children().first().width(rootWidth);
                $leftHalf.children().first().css({ display:'block' });

                $rightHalf.width(rootWidth/2);
                $rightHalf.height(rootHeight);
                $rightHalf.css({ left:rootWidth/2+"px" });
                $rightHalf.children().first().width(rootWidth);
                $rightHalf.children().first().css({
                    display: 'block',
                    left: (-rootWidth/2)+"px"
                });
                
                if(this.DOM.$root.children(this.settings.leftContentClass).length === 0){
                    this.DOM.$root.append($leftHalf);
                }

                if(this.DOM.$root.children(this.settings.rightContentClass).length === 0){
                    this.DOM.$root.append($rightHalf);
                }

                if(this.settings.shadow === true){
                    $containers=this.initShadow({
                        left: $leftHalf,
                        right: $rightHalf
                    });
                    $leftHalf=$containers.left;
                    $rightHalf=$containers.right;
                }

                return {
                    left: $leftHalf,
                    right: $rightHalf
                };
            },

            setMouseEventListeners: function(){
                var that=this;

                var events={
                    mousedown: 'mousedown',
                    mousemove: 'mousemove',
                    mouseup: 'mouseup',
                    click: 'click'
                };

                if(this.settings.mouse === true){
                    this.DOM.$root.on(events.mousedown, function(e){
                        return that.mousedown(e);
                    });

                    this.DOM.$root.on(events.mouseup, function(e){
                        return that.mouseup(e);
                    });

                    this.DOM.$root.on(events.mousemove, function(e){
                        return that.mousemove(e);
                    });    
                }
                
                this.DOM.$nextButton.on(events.click, function(e){
                    that.flipNext();
                });
                
                this.DOM.$prevButton.on(events.click, function(e){
                    that.flipPrev();
                });
            },
            mousedown: function(e){
                if(this.userContext.position){
                    return false;
                }

                if(this.isAnimating === true){
                    return false;
                }

                var pos=this.getMousePos(e);
                var now=new Date().getTime();

                this.userContext.position=pos;
                this.userContext.downTime=now;
                this.userContext.history={
                    x: pos.x,
                    y: pos.y,
                    downTime: now
                };
                
                return true;
            },
            mouseup: function(e){
                if(this.userContext.position === null){
                    return true;
                }

                if(this.isAnimating === true){
                    return true;
                }

                var pos=this.getMousePos(e);

                var diff=this.getMouseMovement(pos);
                if(diff === null){
                    this.resetUserContext();
                    return true;
                }

                var distance=this.getDistance(diff);

                var $current=this.DOM.$root.children('.'+this.settings.workingFlipClass);
                var $next=null;
                var targetDistance=0;

                if(this.userContext.flipSide === this.secondHalf){
                    $next=this.getNextContent($current);
                    if($next.length > 0){
                        targetDistance=this.userContext.flipSide;
                    }else{
                        $next=$current;
                    }
                }else{
                    $next=this.getPrevContent($current);
                    if($next.length > 0){
                        targetDistance=this.userContext.flipSide;
                    }else{
                        $next=$current;
                    }
                }

                this.endFlipAnimation(Math.abs(distance*180));

                e.preventDefault();

                return true;
            },
            mousemove: function(e){
                if(this.userContext.position === null){
                    return false;
                }

                if(this.isAnimating === true){
                    return false;
                }

                var pos=this.getMousePos(e);
                var diff=this.getMouseMovement(pos);

                if(diff === null){
                    return false;
                }

                var distance=this.getDistance(diff);

                this.flipStep(Math.abs(distance*180), this.userContext.$containers);

                e.preventDefault();

                return false;

            },
            getMouseMovement: function(pos){
                if(this.userContext.position === null){
                    return null;
                }

                var diffX=pos.x - this.userContext.position.x;

                if(this.userContext.flipSide === null){
                    if(Math.abs(diffX) > this.settings.startOffset){
                        if(diffX < 0){ // backflip
                            this.userContext.flipSide=this.secondHalf;
                        }else{ // frontflip
                            this.userContext.flipSide=this.firstHalf;
                        }

                        this.startManualFlip(this.userContext.flipSide);
                    }else{
                        return null;
                    }
                }

                return diffX - (this.settings.startOffset * this.userContext.flipSide);
            },
            getMousePos: function(e){
                if(e.clientX === null && e.originalEvent){
                    return{
                        x: e.originalEvent.clientX,
                        y: e.originalEvent.clientY
                    };
                }

                return{
                    x: e.clientX,
                    y: e.clientY
                }
            },
            getDistance: function(diff){
                var distance=diff / this.settings.slideWidth;

                if(this.userContext.flipSide === this.firstHalf){
                    return Math.min(Math.max(0, distance), 1);
                }else{
                    return Math.min(Math.max(-1, distance), 0);
                }
            },

            resetUserContext: function(){
                this.userContext={
                    position:null,
                    downTime:null,
                    history:null,
                    flipSide:null,
                    $containers:null
                }
            },

            getEnvironment: function(){
                this.environment=this.getBrowser();
                this.environment.prefix=this.getPrefix();
            },

            getPrefix: function(){
                var styles = window.getComputedStyle(document.documentElement, ''),
                    pre = (Array.prototype.slice
                                .call(styles)
                                .join('') 
                                .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
                    )[1],
                    dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
                
                return {
                    dom: dom,
                    lowercase: pre,
                    css: '-' + pre + '-',
                    js: pre[0].toUpperCase() + pre.substr(1)
                };
            },

            getBrowser: function(){
                var ua= navigator.userAgent, tem, 
                M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
                if(/trident/i.test(M[1])){
                    tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
                    return{
                        browser: 'IE',
                        version: tem[1] || ''
                    };
                }
                if(M[1]=== 'Chrome'){
                    tem= ua.match(/\bOPR\/(\d+)/)
                    if(tem!= null) 
                        return {
                            browser: 'Opera',
                            version: tem[1]
                        };
                }
                M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
                if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);

                return {
                    browser: M[0],
                    version: M[1]
                };
            }

        };
        // END PARTICLES MainModule
        
        // Initialize PARTICLES if there are any settings, else give us an error
        if(typeof settings === "undefined"){
            settings=defaults;
        }

        pageFlip.init(settings, defaults);
        
        return pageFlip;
    }

    return PageFlip;
}));