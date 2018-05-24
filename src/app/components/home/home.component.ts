import { Component, OnInit } from '@angular/core';
import { ConfigurationService } from '../../services/configuration.service';
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit {
  courseId: number;
  course: any;

  constructor(private configSvc: ConfigurationService, public authSvc: AuthService) {
    this.courseId = 1;
    this.course = {};
  }

  ngOnInit() {
    this.configSvc.getConfig().subscribe(res => console.log(res));
  }

  loadCourse(courseId: number) {
    this.courseId = courseId;
  }

}
