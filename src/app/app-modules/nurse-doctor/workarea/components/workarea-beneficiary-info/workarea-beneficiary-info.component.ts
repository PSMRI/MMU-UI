import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, UserCircle, ClipboardList } from 'lucide-angular';
import { BeneficiaryDetailsComponent } from '../../../../core/components/beneficiary-details/beneficiary-details.component';

@Component({
  selector: 'app-workarea-beneficiary-info',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BeneficiaryDetailsComponent],
  template: `
    <div class="fixed left-6 bottom-24 flex flex-col gap-3 z-40">
      <!-- Toggle Profile Button -->
      <button
        (click)="toggleProfile.emit()"
        class="group flex items-center justify-center size-12 bg-white rounded-2xl shadow-lg border border-zinc-200 text-zinc-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
        title="Toggle Patient Profile">
        <lucide-icon name="user-circle" class="size-6"></lucide-icon>
      </button>

      <!-- Previous Visit Details Button -->
      <button
        (click)="openPreviousVisit.emit()"
        class="group flex items-center justify-center size-12 bg-white rounded-2xl shadow-lg border border-zinc-200 text-zinc-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
        title="Previous Visit Details">
        <lucide-icon name="clipboard-list" class="size-6"></lucide-icon>
      </button>
    </div>
  `,
})
export class WorkareaBeneficiaryInfoComponent {
  @Output() toggleProfile = new EventEmitter<void>();
  @Output() openPreviousVisit = new EventEmitter<void>();
}
