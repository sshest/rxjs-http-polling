import {Observable, Subscription, of, fromEvent, from, empty, merge, timer, startWith, iif, repeat} from 'rxjs';
import { map, mapTo, switchMap, tap, mergeMap, takeUntil, filter, finalize } from 'rxjs/operators';

declare type CatsCategory = 'cats';
declare type MeatsCategory = 'meats';
declare type RequestCategory = CatsCategory | MeatsCategory;

import {AfterContentInit, Component, ContentChild, ElementRef, ViewChild} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterContentInit{
  title = 'http-polling-rxjs';
  public cats_url = 'https://placekitten.com/g/{w}/{h}';
  public meats_url = 'https://baconipsum.com/api/?type=meat-and-filler';

  @ViewChild('start', {static: true}) startButton!: ElementRef;
  @ViewChild('stop', {static: true}) stopButton!: ElementRef;
  @ViewChild('meatsCheckbox', {static: true}) meatsCheckbox!: ElementRef;
  @ViewChild('catsCheckbox', {static: true}) catsCheckbox!: ElementRef;
  @ViewChild('catsImage', {static: true}) catsImage!: ElementRef;
  @ViewChild('text', {static: true}) text!: ElementRef;
  @ViewChild('pollingStatus', {static: true}) pollingStatus!: ElementRef;


  ngAfterContentInit() {
    const stopPolling$ = fromEvent(this.stopButton.nativeElement, 'click');

    const catsClick$ = fromEvent(this.catsCheckbox.nativeElement, 'click')
      .pipe(
        map(_ => 'cats'),
        tap(_ => {
          this.catsImage.nativeElement.style.display = 'block';
          this.text.nativeElement.style.display = 'none';
        })
      );
    const meatsClick$ = fromEvent(this.meatsCheckbox.nativeElement, 'click')
      .pipe(
        map(_ => 'meats'),
        tap(_ => {
          this.catsImage.nativeElement.style.display = 'none';
          this.text.nativeElement.style.display = 'block';
        })
      );

      fromEvent(this.startButton.nativeElement, 'click')
      .pipe(
        mergeMap(_ => merge(
          catsClick$,
          meatsClick$
        ).pipe(
          startWith('cats'),
        )),
        mergeMap((category: string): Observable<{interval: number, category: RequestCategory}> => { // @ts-ignore
          return of({interval: 5000, category})}),
        tap(v => {
          this.pollingStatus.nativeElement.innerHTML = 'Started'
        }),
        takeUntil(stopPolling$),
        switchMap(
          ({interval, category}) => this.startPolling(interval, category)
            .pipe(
              tap((res) => this.render(res, category)),
              takeUntil(stopPolling$),
              finalize(() => this.pollingStatus.nativeElement.innerHTML = 'Stopped')
            )
        ),
        repeat()
      )
      .subscribe();
  }

  requestData(requestCategory: RequestCategory) {
    const xhr = new XMLHttpRequest();
    return from(new Promise<string>((resolve, reject) => {

      // This is generating a random size for a placekitten image
      //   so that we get new cats each request.
      const w = Math.round(Math.random() * 400);
      const h = Math.round(Math.random() * 400);
      const targetUrl = (this as any)[`${requestCategory}_url`]
        .replace('{w}', w.toString())
        .replace('{h}', h.toString());

      xhr.addEventListener("load", () => {
        resolve(xhr.response);
      });
      xhr.open("GET", targetUrl);
      if(this.isCats(requestCategory)) {
        // Our cats urls return binary payloads
        //  so we need to respond as such.
        xhr.responseType = "arraybuffer";
      }
      console.log(requestCategory, this.isCats(requestCategory))
      xhr.send();
    }))
      .pipe(
        mergeMap((data) =>
          this.isCats(requestCategory) ? this.mapCats(data) : this.mapMeats(data)
        )
      );
  }

  mapCats(response: any): Observable<any> {console.log('cats')
    return from(new Promise((resolve, reject) => {
      var blob = new Blob([response], {type: "image/png"});
      let reader = new FileReader();
      reader.onload = (data: ProgressEvent<FileReader>) => {
        resolve(data.target!.result);
      };
      reader.readAsDataURL(blob);
    }));
  }

  mapMeats(response: any): Observable<string> {console.log('meats')
    const parsedData = JSON.parse(response);
    return of(parsedData ? parsedData[0] : '');
  }

  startPolling(interval: number, category: RequestCategory) {
    return timer(0, interval)
      .pipe(
        switchMap(_ => this.requestData(category))
      )
  }

  isCats(category: RequestCategory): category is CatsCategory {
    return category as CatsCategory === 'cats';
  }

  render(result: string, resourceType: RequestCategory) {
    if (this.isCats(resourceType)) {
      this.catsImage.nativeElement.src = result;
    } else {
      this.text.nativeElement.innerHTML = result;
    }
  }

}
