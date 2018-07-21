import {Component, OnInit, ChangeDetectionStrategy, ViewChild, TemplateRef} from '@angular/core';
import {CalendarEvent, CalendarEventAction} from 'angular-calendar';
import { isSameDay, isSameMonth } from 'date-fns';
import { colors } from '../../../utilities/event-colors';
import {Subject} from 'rxjs';
import {CalendarManagementService} from '../calendar-management.service';
import {Announcement} from '../announcements.model';
import {NgbDateAdapter, NgbDateNativeAdapter, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {RolesService} from '../../../services/roles.service';

@Component({
  selector: 'app-calendar-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css'],
  providers: [{provide: NgbDateAdapter, useClass: NgbDateNativeAdapter}]
})
export class CalendarViewComponent implements OnInit {
  refresh: Subject<any> = new Subject();
  activeDayIsOpen: boolean;
  view: string = 'week';
  viewDate: Date = new Date();
  events: CalendarEvent[] = [];
  announcements: Announcement[];
  currentAnnouncement: Announcement = new Announcement();
  currentAction: string;
  @ViewChild('modalContent') modalContent: TemplateRef<any>;
  actions: CalendarEventAction[];
  // edit implementation
  editFormGroup: FormGroup;
  startDateField: Date;

  isCurrentUserTeacher: boolean = false;

  constructor(private cmService: CalendarManagementService,
              private modal: NgbModal,
              private fb: FormBuilder,
              public rolesSvc: RolesService) {
  }

  get today() {
    return new Date();
  }

  ngOnInit() {
    // Loading actions according userTypes:
    if (this.rolesSvc.isAdmin()) {
      this.actions = [
        {
          label: '<i class="fa fa-fw fa-pencil"></i>',
          onClick: ({ event }: { event: CalendarEvent }): void => {
            this.handleEvent('Edited', event);
          }
        },
        {
          label: '<i class="fa fa-fw fa-times"></i>',
          onClick: ({ event }: { event: CalendarEvent }): void => {
            this.handleEvent('Deleted', event);
          }
        }
      ];
    } else if (this.rolesSvc.isTeacher()) {
      this.actions = [] ;
      this.isCurrentUserTeacher = true;
    }

    // loading the Announcements from the database
    this.loadAnnouncements();
    // edit implementation
    this.editFormGroup = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      startDateField: ['', [Validators.required]],
      durationField: ['', [Validators.required, this.checkDuration]]
    });
    // CRITICAL CHANGE FOR SINGLE UPDATE
    this.cmService.singleAnnouncementsInserted
      .subscribe(
        (announcement: Announcement) => {
          this.announcements = this.cmService.getAnnouncements();
          this.events.push({
            id: announcement.id,
            start: announcement.startDate,
            end: announcement.endDate,
            title: announcement.title,
            color: colors.red,
            actions: this.actions
          });
          this.refresh.next();
        }
      );
    // EDIT STUFF
    this.cmService.announcementsUpserted
      .subscribe(
        (announcement: Announcement) => {
          this.announcements = this.cmService.getAnnouncements();
          const objIndex = this.announcements.findIndex((obj => obj.id === announcement.id.toString()));
          this.announcements[objIndex] = announcement;
          const evtIndex = this.events.findIndex((obj => obj.id === announcement.id.toString()));
          this.events[evtIndex].start = announcement.startDate;
          this.events[evtIndex].end = announcement.endDate;
          this.events[evtIndex].title = announcement.title;
          this.refresh.next();
        }
      );
    // DELETE STUFF
    this.cmService.announcementsDeleted
      .subscribe(
        (announcement: Announcement) => {
          this.announcements = this.announcements.filter(iAnnounce => iAnnounce !== announcement);
          const evtIndex = this.events.findIndex((obj => obj.id === announcement.id.toString()));
          if (evtIndex !== -1) {
            this.events.splice(evtIndex, 1);
          }
          this.refresh.next();
          this.announcements = this.cmService.getAnnouncements();
        }
      );
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  public loadAnnouncements() {
    this.cmService.loadAnnouncementsFromDB()
      .subscribe(
        (announcements: Announcement[]) => {
          this.cmService.setAnnouncements(announcements);
          this.announcements = this.cmService.getAnnouncements();
          for (let entry of announcements) {
            this.events.push({
              id : entry.id,
              start: new Date(entry.startDate.toString()),
              end: new Date(entry.endDate.toString()),
              title: entry.title,
              color: colors.red,
              actions: this.actions
            });
          }
          this.refresh.next();
        }
      );
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.currentAnnouncement = this.announcements.find( search => search.id === event.id.toString() );
    this.currentAction = action;
    if (this.currentAction === 'Deleted') {
      this.modal.open(this.modalContent, {size: 'sm'});
    } else {
      if (this.currentAction === 'Clicked') {
        this.modal.open(this.modalContent);
      } else
        if (this.currentAction === 'Edited') {
          this.rebuildForm();
          this.modal.open(this.modalContent);
        }
    }
  }

  rebuildForm() {
    this.editFormGroup.reset({
      title: this.currentAnnouncement.title,
      description: this.currentAnnouncement.description,
      startDateField: new Date(this.currentAnnouncement.startDate),
      durationField: this.substractDays(this.currentAnnouncement.startDate, this.currentAnnouncement.endDate)
    });
  }

  resetForm() {
    this.editFormGroup.reset();
  }

  // edit form validation
  checkDuration(control: FormControl) {
    if (control.value <= 0 || control.value > 30 ) {
      return {validDuration: true};
    } else {
      return null;
    }
  }

  private substractDays(start: any, end: any) : number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let result = 0;
    result = (endDate.getDate() - startDate.getDate()) + 1;
    return result;
  }

  private addDays(date: any, days: number ): Date {
    const result = new Date( date );
    result.setDate(result.getDate() + days - 1 );
    return result;
  }

  updateAnnouncement() {
    this.currentAnnouncement.title = this.editFormGroup.get('title').value;
    this.currentAnnouncement.description = this.editFormGroup.get('description').value;
    this.currentAnnouncement.startDate = this.editFormGroup.get('startDateField').value;
    this.currentAnnouncement.endDate = this.editFormGroup.get('durationField').value;
    this.currentAnnouncement.endDate = this.addDays(this.currentAnnouncement.startDate, this.currentAnnouncement.endDate);
    this.cmService.upsertAnnouncement(this.currentAnnouncement).subscribe(
      (response) => {
        console.log(response);
        this.cmService.updateSingleAnnouncement(this.currentAnnouncement, 'Update');
      },
      (error) => console.log(error)
    );
  }

  deleteAnnouncement() {
    this.cmService.deleteAnnouncement(this.currentAnnouncement).subscribe(
      (response) => {
        console.log(response);
        this.cmService.updateSingleAnnouncement(this.currentAnnouncement, 'Delete');
      },
      (error) => console.log(error)
    );
  }
}
