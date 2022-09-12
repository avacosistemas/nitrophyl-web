// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    //server: 'http://nitrophyl-env.eba-uipv2mcj.us-east-1.elasticbeanstalk.com/'
    //server: 'http://localhost:8080/ws-rest-authentication/'
    //server: 'http://7.100.170.120:8080/ws-rest-authentication/'
    server: 'http://gestion-pc:8080/nitro-api-test/'
    //server: 'http://gestion-pc:8080/ws-rest-authentication/'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
