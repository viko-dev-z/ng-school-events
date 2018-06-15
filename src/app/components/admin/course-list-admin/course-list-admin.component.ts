import { Component, OnInit } from "@angular/core";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";
import { CoursesService } from "../../../services/courses.service";

@Component({
  selector: "app-course-list-admin",
  templateUrl: "./course-list-admin.component.html",
  styleUrls: ["./course-list-admin.component.css"]
})
export class CourseListAdminComponent implements OnInit {
  closeResult: string;
  newCourse = {};
  courseList = [];
  searchText = "";
  currentPage = 0;
  constructor(
    private modalService: NgbModal,
    private coursesSvc: CoursesService
  ) {
  }

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.coursesSvc
      .getCourses(this.searchText, this.currentPage)
      .subscribe(courses => (this.courseList = courses));
  }

  saveCourse() {
    let newCourse = this.newCourse;
    this.coursesSvc.registerCourse(newCourse).subscribe(course => {
      this.loadCourses();
    });
  }

  open(content) {
    this.modalService.open(content).result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }
  
  search() {
    this.loadCourses();
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }
}