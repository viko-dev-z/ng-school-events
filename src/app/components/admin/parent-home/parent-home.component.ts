import { Component, OnInit, Input } from "@angular/core";
import { ParentsService } from "../../../services/parents.service";
import { StudentsService } from "../../../services/students.service";
import { ActivatedRoute } from "@angular/router";
import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-parent-home",
  templateUrl: "./parent-home.component.html",
  styleUrls: ["./parent-home.component.css"]
})
export class ParentHomeComponent implements OnInit {
  assignedStudents = [];
  availableStudents = [];
  parentId = "";
  parent: any;
  confMessage = "";
  closeResult: string;

  constructor(
    private parentsSvc: ParentsService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private studentsSvc: StudentsService
  ) {
    this.parent = {};
  }

  ngOnInit() {
    this.parentId = this.route.snapshot.paramMap.get("id");
    this.parentsSvc.getParent(this.parentId).subscribe(parent => {
      this.parent = parent;
    });

    this.studentsSvc.getStudents().subscribe(students => {
      this.availableStudents = students;
    });

    this.loadStudents();
  }

  loadStudents() {
    this.assignedStudents = [];
    this.parentsSvc.getStudents(this.parentId).subscribe(students => {
      this.assignedStudents = students;
    });
  }

  addStudent(student) {
    let studentParent = {
      "student-yearId": student.id,
      parentId: this.parentId
    };
    this.studentsSvc
      .saveParentStudentRel(studentParent)
      .subscribe(updatedStudent => {
        this.loadStudents();
      });
  }

  removeStudent(relId) {
    this.studentsSvc.removeParentStudentRel(relId).subscribe(res => {
      this.confMessage = "Student Removed";
      this.loadStudents();
    });
  }

}
