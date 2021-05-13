import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';
import * as moment from 'moment';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { VaccineNotifierDashboardService } from './vaccine-notifier-dashboard.service';

export enum SearchByTab {
  District,
  PinCode
}

export interface State {
  readonly state_id: number;
  readonly state_name: string;
}

export interface District {
  readonly district_id: number,
  readonly district_name: string;
}

@Component( {
  selector : 'app-vaccine-notifier-dashboard',
  templateUrl : './vaccine-notifier-dashboard.component.html',
  styleUrls : [ './vaccine-notifier-dashboard.component.scss' ]
} )
export class VaccineNotifierDashboardComponent implements OnInit {

  public monitoringId;
  public states$: Observable<State[]>;
  public districts$: Observable<District[]>;
  public vaccineNotifierFormGroup: FormGroup;

  private availableSlotsSubject: BehaviorSubject<any> = new BehaviorSubject<any>( undefined );
  public availableSlots$: Observable<any> = this.availableSlotsSubject.asObservable();

  public displayedColumns: string[] = [ 'vaccine', 'date', 'pinCode', 'availableCapacity', 'ageGroup', 'name', 'address' ];

  public pollingIntervals = [
    { value : 20, label : '20sec' },
    { value : 30, label : '30sec' },
    { value : 45, label : '45sec' },
    { value : 90, label : '90sec' },
    { value : 120, label : '120sec' },
    { value : 180, label : '180sec' },
  ];

  private selectedTab: SearchByTab;

  constructor(
    private vaccineNotifierDashboardService: VaccineNotifierDashboardService,
  ) {
  }

  set availableSlots( value: any ) {
    this.availableSlotsSubject.next( [
      ...value,
      ...( this.availableSlotsSubject.getValue() || [] ),
    ] );
  }

  ngOnInit(): void {
    this.states$ = this.vaccineNotifierDashboardService.loadStates();
    this.vaccineNotifierFormGroup = new FormGroup( {
      state : new FormControl( undefined, Validators.required ),
      districts : new FormControl( [], Validators.required ),
      pollingInterval : new FormControl( 20, Validators.required ),
      ageGroup18Plus : new FormControl( true, Validators.required ),
      ageGroup45Plus : new FormControl( false, Validators.required ),
      makeSound : new FormControl( true, Validators.required ),
      pinCode : new FormControl(),
    } );
    this.vaccineNotifierFormGroup.get( 'state' ).valueChanges.pipe(
      filter( ( stateId: number ) => !!stateId ),
    ).subscribe( ( stateId: number ) => {
      this.districts$ = this.vaccineNotifierDashboardService.loadDistricts( stateId );
    } );
  }

  handleSearchByTabChange( tabChangeEvent: MatTabChangeEvent ): void {
    this.selectedTab = tabChangeEvent.index;
    const stateFormControl = this.vaccineNotifierFormGroup.get( 'state' );
    const districtsFormControl = this.vaccineNotifierFormGroup.get( 'districts' );
    const pinCodeFormControl = this.vaccineNotifierFormGroup.get( 'pinCode' );
    if ( this.selectedTab === SearchByTab.District ) {
      stateFormControl.setValidators( Validators.required );
      districtsFormControl.setValidators( Validators.required );
      pinCodeFormControl.clearValidators();
    } else if ( this.selectedTab === SearchByTab.PinCode ) {
      stateFormControl.clearValidators();
      districtsFormControl.clearValidators();
      pinCodeFormControl.setValidators( [ Validators.required, Validators.minLength( 6 ) ] );
    }
    stateFormControl.updateValueAndValidity();
    districtsFormControl.updateValueAndValidity();
    pinCodeFormControl.updateValueAndValidity();
  }

  startMonitoring(): void {
    this.availableSlotsSubject.next( [] );
    this.vaccineNotifierFormGroup.disable();
    const pollingInterval = this.vaccineNotifierFormGroup.get( 'pollingInterval' ).value;
    this.checkAvailableSlots(); // search immediately and then through intervals
    this.monitoringId = setInterval( () => {
      this.checkAvailableSlots();
    }, pollingInterval * 1000 );
  }

  stopMonitoring(): void {
    clearInterval( this.monitoringId );
    this.monitoringId = undefined;
    this.vaccineNotifierFormGroup.enable();
  }

  checkAvailableSlots(): void {
    const date = moment().format( 'DD-MM-YYYY' ).toString();
    if ( this.selectedTab === SearchByTab.District ) {
      const districts: number[] = this.vaccineNotifierFormGroup.get( 'districts' ).value;
      districts.forEach( districtCode => {
        this.vaccineNotifierDashboardService.getCalendarByDistrict( districtCode, date ).subscribe( ( res: any ) => {
          this.handleResponse( res );
        } );
      } );
    } else if ( this.selectedTab === SearchByTab.PinCode ) {
      const pinCode = this.vaccineNotifierFormGroup.get( 'pinCode' ).value;
      this.vaccineNotifierDashboardService.getCalendarByPin( pinCode, date ).subscribe( ( res: any ) => {
        this.handleResponse( res );
      } );
    }
  }

  private handleResponse( res: any ): void {
    const availableCenters = [];
    const centers = res.centers;
    const makeSound = this.vaccineNotifierFormGroup.get( 'makeSound' ).value;
    const ageGroup18Plus = this.vaccineNotifierFormGroup.get( 'ageGroup18Plus' ).value;
    const ageGroup45Plus = this.vaccineNotifierFormGroup.get( 'ageGroup45Plus' ).value;
    centers?.forEach( center => {
      center.sessions?.forEach( session => {
        if ( !ageGroup18Plus && session.min_age_limit === 18 ) {
          return;
        }
        if ( !ageGroup45Plus && session.min_age_limit >= 45 ) {
          return;
        }
        session.available_capacity = Math.round( session.available_capacity );
        if ( session.available_capacity > 0 ) {
          console.log(
            'vaccine: ' + session.vaccine,
            '| min_age_limit: ' + session.min_age_limit,
            '| date: ' + session.date,
            '| pincode: ' + center.pincode,
            '| availableCapacity: ' + session.available_capacity,
            center,
            new Date(),
          );
          availableCenters.push( { center, session } );
          if ( makeSound ) {
            for ( let i = 0; i < 5; i++ ) {
              setTimeout( () => {
                this.beep();
              }, i * 1000 );
            }
          }
        }
      } );
    } );
    this.availableSlots = availableCenters;
  }

  private beep(): void {
    const snd = new Audio( 'data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=' );
    snd.play();
  }
}


