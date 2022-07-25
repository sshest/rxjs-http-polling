import { Observable, Subscription, of, fromEvent, from, empty, merge, timer } from 'rxjs';
import { map, mapTo, switchMap, tap, mergeMap, takeUntil, filter, finalize } from 'rxjs/operators';

declare type RequestCategory = 'cats' | 'meats';

import {AfterContentInit, Component, ContentChild} from '@angular/core';
import {RadioControlValueAccessor} from "@angular/forms";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterContentInit{
  title = 'http-polling-rxjs';

  @ContentChild('start') startButton!: HTMLButtonElement;
  @ContentChild('stop') stopButton!: HTMLButtonElement;
  @ContentChild('meatsCheckbox') meatsCheckbox!: HTMLInputElement;
  @ContentChild('catsCheckbox') catsCheckbox!: HTMLInputElement;
  @ContentChild('catsImage') catsImage!: HTMLImageElement;
  @ContentChild('text') text!: HTMLParagraphElement;

  ngAfterContentInit() {

  }

}
