import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import type { ClassValue } from 'clsx';
import { mergeClasses } from '@/lib/utils/merge-classes';
import { cva } from 'class-variance-authority';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

@Component({
  selector: 'z-label, label[z-label]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
})
export class ZardLabelComponent {
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses(labelVariants(), this.class()));
}
