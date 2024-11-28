import { Injectable } from '@angular/core';
import { jwtDecode, JwtPayload } from 'jwt-decode';

export class AuthUtils {
  /**
   * Constructor
   */
  constructor() { }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Is token expired?
   *
   * @param token
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      const expDate = new Date(decodedToken.exp * 1000);
      return expDate < new Date();
    } catch (e) {
      console.error('Error decoding token', e);
      return true;
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Decode token
   *
   * @param token
   * @private
   */
  static decodeToken(token: string): JwtPayload | null {
    if (token && token.split('.').length === 3) {
      try {
        return jwtDecode<JwtPayload>(token);
      } catch (e) {
        console.error('Error decoding token', e);
      }
    } else {
      console.error('Token inválido:', token);
    }
    return null;
  }


  /**
   * Get token expiration date
   *
   * @param token
   * @private
   */
  private static _getTokenExpirationDate(token: string): Date | null {
    const decodedToken = this.decodeToken(token);

    if (!decodedToken || !decodedToken.hasOwnProperty('exp')) {
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decodedToken.exp);

    return date;
  }
}
