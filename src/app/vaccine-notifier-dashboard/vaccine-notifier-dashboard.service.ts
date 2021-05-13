import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { District, State } from './vaccine-notifier-dashboard.component';

@Injectable( {
  providedIn : 'root',
} )
export class VaccineNotifierDashboardService {

  private readonly endPoint: string = 'https://www.cowin.gov.in/api/v2';

  constructor(
    private httpClient: HttpClient,
  ) {
  }

  public loadStates(): Observable<State[]> {
    return this.httpClient.get<State[]>( `${ this.endPoint }/admin/location/states` ).pipe(
      map( ( res: any ) => res.states ),
    );
  }

  public loadDistricts( stateId: number ): Observable<District[]> {
    return this.httpClient.get<District[]>( `${ this.endPoint }/admin/location/districts/${ stateId }` ).pipe(
      map( ( res: any ) => res.districts ),
    );
  }

  public getCalendarByDistrict( districtId: number, date: string ): Observable<any> {
    const opts = {
      params : new HttpParams( { fromString : `district_id=${ districtId }&date=${ date }` } ),
    };
    return this.httpClient.get<any>(
      `${ this.endPoint }/appointment/sessions/public/calendarByDistrict`,
      opts,
    );
  }

  public getCalendarByPin( pinCode: string, date: string ): Observable<any> {
    const opts = {
      params : new HttpParams( { fromString : `pincode=${ pinCode }&date=${ date }` } ),
    };
    return this.httpClient.get<any>(
      `${ this.endPoint }/appointment/sessions/public/calendarByPin`,
      opts,
    );
  }

}
