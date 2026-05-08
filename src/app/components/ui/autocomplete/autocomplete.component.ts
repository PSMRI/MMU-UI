import { Component, Input, Output, EventEmitter, forwardRef, ContentChildren, QueryList, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocomplete } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'z-autocomplete-option',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
})
export class ZardAutocompleteOptionComponent {
  @Input() zValue: any;
}

@Component({
  selector: 'z-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatAutocompleteModule, MatInputModule, MatFormFieldModule],
  template: `
    <div class="z-autocomplete-container">
      <input
        type="text"
        [placeholder]="placeholder"
        [matAutocomplete]="auto"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (focus)="onFocus()"
        [value]="value"
        class="w-full px-3 py-2 border rounded-md"
      />
      <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayWith" (optionSelected)="onOptionSelected($event)">
        <mat-option *ngFor="let option of options" [value]="option.zValue">
          {{ option.zValue?.chiefComplaint || option.zValue }}
        </mat-option>
      </mat-autocomplete>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardAutocompleteComponent),
      multi: true,
    },
  ],
})
export class ZardAutocompleteComponent implements ControlValueAccessor {
  @Input() placeholder: string = '';
  @Input() displayWith: ((value: any) => string) | null = null;
  @Output() optionSelected = new EventEmitter<any>();
  @Output() keyup = new EventEmitter<any>();
  @Output() blur = new EventEmitter<any>();
  @Output() focus = new EventEmitter<any>();

  @ContentChildren(ZardAutocompleteOptionComponent) options!: QueryList<ZardAutocompleteOptionComponent>;

  value: any = '';
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInput(event: any) {
    this.value = event.target.value;
    this.onChange(this.value);
    this.keyup.emit(event);
  }

  onBlur() {
    this.onTouched();
    this.blur.emit();
  }

  onFocus() {
    this.focus.emit();
  }

  onOptionSelected(event: any) {
    this.value = event.option.value;
    this.onChange(this.value);
    this.optionSelected.emit(event);
  }
}
