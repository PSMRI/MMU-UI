"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZardTooltipComponent = exports.ZardTooltipDirective = void 0;
var overlay_1 = require("@angular/cdk/overlay");
var portal_1 = require("@angular/cdk/portal");
var common_1 = require("@angular/common");
var core_1 = require("@angular/core");
var rxjs_interop_1 = require("@angular/core/rxjs-interop");
var rxjs_1 = require("rxjs");
var tooltip_positions_1 = require("@/components/ui/tooltip/tooltip-positions");
var tooltip_variants_1 = require("@/components/ui/tooltip/tooltip.variants");
var core_2 = require("@/shared/core");
var merge_classes_1 = require("@/lib/utils/merge-classes");
var throttle = function (callback, wait) {
    var time = Date.now();
    return function () {
        if (time + wait - Date.now() < 0) {
            callback();
            time = Date.now();
        }
    };
};
var ZardTooltipDirective = function () {
    var _classDecorators = [(0, core_1.Directive)({
            selector: '[zTooltip]',
            host: {
                style: 'cursor: pointer',
            },
            exportAs: 'zTooltip',
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ZardTooltipDirective = _classThis = /** @class */ (function () {
        function ZardTooltipDirective_1() {
            var _this = this;
            this.destroyRef = (0, core_1.inject)(core_1.DestroyRef);
            this.document = (0, core_1.inject)(common_1.DOCUMENT);
            this.elementRef = (0, core_1.inject)((core_1.ElementRef));
            this.injector = (0, core_1.inject)(core_1.Injector);
            this.overlay = (0, core_1.inject)(overlay_1.Overlay);
            this.overlayPositionBuilder = (0, core_1.inject)(overlay_1.OverlayPositionBuilder);
            this.platformId = (0, core_1.inject)(core_1.PLATFORM_ID);
            this.renderer = (0, core_1.inject)(core_1.Renderer2);
            this.listenersRefs = [];
            this.zPosition = (0, core_1.input)('top');
            this.zTrigger = (0, core_1.input)('hover');
            this.zTooltip = (0, core_1.input)(null);
            this.zShowDelay = (0, core_1.input)(150, { transform: core_1.numberAttribute });
            this.zHideDelay = (0, core_1.input)(100, { transform: core_1.numberAttribute });
            this.zShow = (0, core_1.output)();
            this.zHide = (0, core_1.output)();
            this.tooltipText = (0, core_1.computed)(function () {
                var tooltipText = _this.zTooltip();
                if (!tooltipText) {
                    return '';
                }
                else if (typeof tooltipText === 'string') {
                    tooltipText = tooltipText.trim();
                }
                return tooltipText;
            });
        }
        ZardTooltipDirective_1.prototype.ngOnInit = function () {
            var _this = this;
            if ((0, common_1.isPlatformBrowser)(this.platformId)) {
                var positionStrategy = this.overlayPositionBuilder
                    .flexibleConnectedTo(this.elementRef)
                    .withPositions([tooltip_positions_1.TOOLTIP_POSITIONS_MAP[this.zPosition()]]);
                this.overlayRef = this.overlay.create({ positionStrategy: positionStrategy });
                (0, core_1.runInInjectionContext)(this.injector, function () {
                    (0, rxjs_interop_1.toObservable)(_this.zTrigger)
                        .pipe((0, rxjs_1.tap)(function () {
                        _this.setupDelayMechanism();
                        _this.cleanupTriggerEvents();
                        _this.initTriggers();
                    }), (0, rxjs_1.filter)(function () { return !!_this.overlayRef; }), (0, rxjs_1.switchMap)(function () { return _this.overlayRef.outsidePointerEvents(); }), (0, rxjs_1.filter)(function (event) { return !_this.elementRef.nativeElement.contains(event.target); }), (0, rxjs_interop_1.takeUntilDestroyed)(_this.destroyRef))
                        .subscribe(function () { return _this.delay(false, 0); });
                });
            }
        };
        ZardTooltipDirective_1.prototype.ngOnDestroy = function () {
            var _a, _b;
            // Clean up any pending effect
            if (this.ariaEffectRef) {
                this.ariaEffectRef.destroy();
                this.ariaEffectRef = undefined;
            }
            (_a = this.delaySubject) === null || _a === void 0 ? void 0 : _a.complete();
            this.cleanupTriggerEvents();
            (_b = this.overlayRef) === null || _b === void 0 ? void 0 : _b.dispose();
        };
        ZardTooltipDirective_1.prototype.initTriggers = function () {
            this.initScrollListener();
            this.initClickListeners();
            this.initHoverListeners();
        };
        ZardTooltipDirective_1.prototype.initClickListeners = function () {
            var _this = this;
            if (this.zTrigger() !== 'click') {
                return;
            }
            this.listenersRefs = __spreadArray(__spreadArray([], this.listenersRefs, true), [
                this.renderer.listen(this.elementRef.nativeElement, 'click', function () {
                    var _a;
                    var shouldShowTooltip = !((_a = _this.overlayRef) === null || _a === void 0 ? void 0 : _a.hasAttached());
                    var delay = shouldShowTooltip ? _this.zShowDelay() : _this.zHideDelay();
                    _this.delay(shouldShowTooltip, delay);
                }),
            ], false);
        };
        ZardTooltipDirective_1.prototype.initHoverListeners = function () {
            var _this = this;
            if (this.zTrigger() !== 'hover') {
                return;
            }
            this.listenersRefs = __spreadArray(__spreadArray([], this.listenersRefs, true), [
                this.renderer.listen(this.elementRef.nativeElement, 'mouseenter', function () { return _this.delay(true, _this.zShowDelay()); }),
                this.renderer.listen(this.elementRef.nativeElement, 'mouseleave', function () { return _this.delay(false, _this.zHideDelay()); }),
                this.renderer.listen(this.elementRef.nativeElement, 'focus', function () { return _this.delay(true, _this.zShowDelay()); }),
                this.renderer.listen(this.elementRef.nativeElement, 'blur', function () { return _this.delay(false, _this.zHideDelay()); }),
            ], false);
        };
        ZardTooltipDirective_1.prototype.initScrollListener = function () {
            var _this = this;
            this.listenersRefs = __spreadArray(__spreadArray([], this.listenersRefs, true), [
                this.renderer.listen(this.document.defaultView, 'scroll', throttle(function () { return _this.delay(false, 0); }, 100)),
            ], false);
        };
        ZardTooltipDirective_1.prototype.cleanupTriggerEvents = function () {
            for (var _i = 0, _a = this.listenersRefs; _i < _a.length; _i++) {
                var eventRef = _a[_i];
                eventRef();
            }
            this.listenersRefs = [];
        };
        ZardTooltipDirective_1.prototype.delay = function (isShow, delay) {
            var _a;
            if (delay === void 0) { delay = -1; }
            (_a = this.delaySubject) === null || _a === void 0 ? void 0 : _a.next({ isShow: isShow, delay: delay });
        };
        ZardTooltipDirective_1.prototype.setupDelayMechanism = function () {
            var _this = this;
            var _a;
            (_a = this.delaySubject) === null || _a === void 0 ? void 0 : _a.complete();
            this.delaySubject = new rxjs_1.Subject();
            this.delaySubject
                .pipe((0, rxjs_1.switchMap)(function (config) { return (config.delay < 0 ? (0, rxjs_1.of)(config) : (0, rxjs_1.timer)(config.delay).pipe((0, rxjs_1.map)(function () { return config; }))); }), (0, rxjs_interop_1.takeUntilDestroyed)(this.destroyRef))
                .subscribe(function (config) {
                if (config.isShow) {
                    _this.show();
                }
                else {
                    _this.hide();
                }
            });
        };
        ZardTooltipDirective_1.prototype.show = function () {
            var _this = this;
            var _a, _b, _c, _d;
            if (this.componentRef || !this.tooltipText()) {
                return;
            }
            var tooltipPortal = new portal_1.ComponentPortal(ZardTooltipComponent);
            this.componentRef = (_a = this.overlayRef) === null || _a === void 0 ? void 0 : _a.attach(tooltipPortal);
            (_b = this.componentRef) === null || _b === void 0 ? void 0 : _b.onDestroy(function () {
                _this.componentRef = undefined;
            });
            (_c = this.componentRef) === null || _c === void 0 ? void 0 : _c.instance.state.set('opened');
            (_d = this.componentRef) === null || _d === void 0 ? void 0 : _d.instance.setProps(this.tooltipText(), this.zPosition());
            (0, core_1.runInInjectionContext)(this.injector, function () {
                _this.ariaEffectRef = (0, core_1.effect)(function () {
                    var _a, _b, _c;
                    var tooltipId = (_b = (_a = _this.componentRef) === null || _a === void 0 ? void 0 : _a.instance.uniqueId()) === null || _b === void 0 ? void 0 : _b.id();
                    if (tooltipId) {
                        _this.renderer.setAttribute(_this.elementRef.nativeElement, 'aria-describedby', tooltipId);
                        (_c = _this.ariaEffectRef) === null || _c === void 0 ? void 0 : _c.destroy();
                        _this.ariaEffectRef = undefined;
                    }
                });
            });
            this.zShow.emit();
        };
        ZardTooltipDirective_1.prototype.hide = function () {
            var _a;
            if (!this.componentRef) {
                return;
            }
            // Clean up any pending effect
            if (this.ariaEffectRef) {
                this.ariaEffectRef.destroy();
                this.ariaEffectRef = undefined;
            }
            this.renderer.removeAttribute(this.elementRef.nativeElement, 'aria-describedby');
            this.componentRef.instance.state.set('closed');
            this.zHide.emit();
            (_a = this.overlayRef) === null || _a === void 0 ? void 0 : _a.detach();
        };
        return ZardTooltipDirective_1;
    }());
    __setFunctionName(_classThis, "ZardTooltipDirective");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ZardTooltipDirective = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ZardTooltipDirective = _classThis;
}();
exports.ZardTooltipDirective = ZardTooltipDirective;
var ZardTooltipComponent = function () {
    var _classDecorators = [(0, core_1.Component)({
            selector: 'z-tooltip',
            imports: [core_2.ZardStringTemplateOutletDirective, core_2.ZardIdDirective],
            template: "\n    <ng-container *zStringTemplateOutlet=\"tooltipText()\" zardId=\"tooltip\" #z=\"zardId\">{{ tooltipText() }}</ng-container>\n\n    <span [class]=\"arrowClasses()\">\n      <svg\n        class=\"bg-foreground fill-foreground z-50 block size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]\"\n        width=\"10\"\n        height=\"5\"\n        viewBox=\"0 0 30 10\"\n        preserveAspectRatio=\"none\"\n      >\n        <polygon points=\"0,0 30,0 15,10\" />\n      </svg>\n    </span>\n  ",
            changeDetection: core_1.ChangeDetectionStrategy.OnPush,
            host: {
                '[class]': 'classes()',
                '[attr.id]': 'tooltipId()',
                '[attr.data-side]': 'position()',
                '[attr.data-state]': 'state()',
                role: 'tooltip',
            },
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ZardTooltipComponent = _classThis = /** @class */ (function () {
        function ZardTooltipComponent_1() {
            var _this = this;
            this.arrowClasses = (0, core_1.computed)(function () {
                return (0, merge_classes_1.mergeClasses)((0, tooltip_variants_1.tooltipPositionVariants)({ position: _this.position() }));
            });
            this.classes = (0, core_1.computed)(function () { return (0, merge_classes_1.mergeClasses)((0, tooltip_variants_1.tooltipVariants)()); });
            this.position = (0, core_1.signal)('top');
            this.state = (0, core_1.signal)('closed');
            this.uniqueId = (0, core_1.viewChild)('z');
            this.tooltipText = (0, core_1.signal)(null);
            this.tooltipId = (0, core_1.computed)(function () { var _a, _b; return (_b = (_a = _this.uniqueId()) === null || _a === void 0 ? void 0 : _a.id()) !== null && _b !== void 0 ? _b : 'tooltip'; });
        }
        ZardTooltipComponent_1.prototype.setProps = function (tooltipText, position) {
            if (tooltipText) {
                this.tooltipText.set(tooltipText);
            }
            this.position.set(position);
        };
        return ZardTooltipComponent_1;
    }());
    __setFunctionName(_classThis, "ZardTooltipComponent");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ZardTooltipComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ZardTooltipComponent = _classThis;
}();
exports.ZardTooltipComponent = ZardTooltipComponent;
