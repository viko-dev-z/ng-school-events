import { Component, OnInit} from '@angular/core';
import { setTheme } from "ngx-bootstrap/utils";
import { AuthService } from "./services/auth.service";
import { RolesService } from "./services/roles.service";
import { ParentsService } from "./services/parents.service";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { ActivatedRoute, NavigationEnd } from "@angular/router";
import { SocketService } from "./services/socket.service";
import { NotificationsService } from "angular2-notifications";
import { FollowUpsService } from "./services/follow-ups.service";
import { ConfigurationService } from "./services/configuration.service";

enum Action {
  JOINED,
  LEFT,
  RENAME
}

enum Event {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect'
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  title = "app";
  parentToggle = "";
  teacherToggle = "";
  userType: "";
  userName: "";
  breadcrumbs: any;
  sons = [];

  action = Action;
  user: any;
  messages: any[] = [];
  messageContent: string;
  ioConnection: any;
  dataContentEvents = ``;
  countFollowUps = 0;

  constructor(
    public authSvc: AuthService,
    public rolesSvc: RolesService,
    public parentsSvc: ParentsService,
    private location: Location,
    private router: ActivatedRoute,
    private socketService: SocketService,
    private _notificationSvc: NotificationsService,
    private followUpsSvc: FollowUpsService,
    private confSvc: ConfigurationService
  ) {
    setTheme("bs4");
    this.userType = this.rolesSvc.getUserType();
    this.userName = this.rolesSvc.getUserName();

    setTimeout(() => {
      if (rolesSvc.isParent()) {
        parentsSvc.getSons().subscribe(
          sons =>
            (this.sons = sons.map(son => {
              return {
                id: son.id,
                routeLink: "parent/son/" + son.id,
                student: son.student
              };
            }))
        );
      }
    }, 500);
  }

  ngOnInit(): void {
    this.initIoConnection();
    this.loadNotification();
  }

  loadNotification(): void {
    this.followUpsSvc
    .getFollowUpsAll()
    .subscribe(followUps => {
      this.dataContentEvents = `<ul class="list-group">`;
      for (let i = 0; i < followUps.length; i++) {
        this.dataContentEvents += `<li class="list-group-item">${followUps[i].title}</li>`;
      }
      this.dataContentEvents += `</ul>`;
    });

    this.followUpsSvc
    .getFollowUpsCountAll()
    .subscribe(countInfo => {
      console.log(countInfo.count);
      this.countFollowUps = countInfo.count;
    });
  }

  reloadUrl(sonUrl) {
    location.href = "" + sonUrl;
  }

  private initIoConnection(): void {
    this.socketService.initSocket();

    this.ioConnection = this.socketService
      .onMessage()
      .subscribe((message: any) => {
        console.log(message);
        this.messages.push(message);
      });
    //chat message
    this.socketService.onEvent(Event.CONNECT).subscribe(() => {
      console.log("connected");
    });

    this.socketService.onEvent("message").subscribe(data => {
        
    });

    this.socketService.onEvent("followUp").subscribe(data => {
      
      console.log(data);
      console.log("follow up");
      var temp = {
        animate: "fromRight",
        clickToClose: true,
        pauseOnHover: true,
        showProgressBar: true,
        timeOut: 3000
      };
      this._notificationSvc.create("Title", "One follow up created", "success", temp);
    });

    this.socketService.onEvent(Event.DISCONNECT).subscribe(() => {
      console.log("disconnected");
    });
  }

  sendMessageVoid() {
    this.sendMessage("Some is viewing notifications");
    /*
    console.log("This ii");
    var temp = {
      animate: "fromRight",
      clickToClose: true,
      pauseOnHover: true,
      showProgressBar: true,
      timeOut: 5000
    };

    this._notificationSvc.create(
      "Title",
      "Hello This is a notification",
      "success",
      temp
    );

    */
  }

  public sendMessage(message: string) {
    if (!message) {
      return;
    }

    this.socketService.followUp({
      from: this.rolesSvc.getUserName(),
      content: message
    });
    this.messageContent = null;
  }
}
