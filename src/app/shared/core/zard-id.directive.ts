import { Directive, input } from '@angular/core';

let nextId = 0;

@Directive({
  selector: '[zardId]',
  standalone: true,
  exportAs: 'zardId',
})
export class ZardIdDirective {
  readonly zardId = input<string>('');
  private readonly _generatedId = `zrd-id-${nextId++}`;

  readonly id = () => this.zardId() || this._generatedId;
}
