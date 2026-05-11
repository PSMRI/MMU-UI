import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  ViewEncapsulation,
  contentChildren,
  effect,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ClassValue } from 'clsx';
import { mergeClasses } from '@/lib/utils/merge-classes';
import { ZardRadioComponent } from './radio.component';

@Component({
  selector: 'z-radio-group',
  standalone: true,
  template: '<ng-content />',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardRadioGroupComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    role: 'radiogroup',
  },
})
export class ZardRadioGroupComponent implements ControlValueAccessor {
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses('grid gap-2', this.class()));

  readonly radios = contentChildren(ZardRadioComponent, { descendants: true });

  private _value: any;

  constructor() {
    effect(() => {
      const radios = this.radios();
      radios.forEach(radio => {
        radio.radioChange.subscribe(() => {
          this.updateValueFromRadio(radio);
        });
        // Set initial state
        radio.writeValue(this._value);
      });
    });
  }

  updateValueFromRadio(radio: ZardRadioComponent) {
    this._value = radio.zValue();
    this.onChange(this._value);
    this.onTouched();
    
    // Uncheck other radios
    this.radios().forEach(r => {
      if (r !== radio) {
        r.checked = false;
      }
    });
  }

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onChange: (value: any) => void = () => {};
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    this._value = value;
    this.radios().forEach(radio => radio.writeValue(value));
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.radios().forEach(radio => radio.setDisabledState(isDisabled));
  }
}
