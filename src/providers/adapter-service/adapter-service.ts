import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

/*
  Generated class for the AdapterServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AdapterServiceProvider {

  callAdapter (adapterName:string, path:string, verb:string, content: any): Promise<any> {
    
    verb = verb.toUpperCase();
    let rrVerb = verb === "GET" ? WLResourceRequest.GET : (verb === "POST" ? WLResourceRequest.POST : (verb === "PUT" ? WLResourceRequest.PUT : (verb === "DELETE" ? WLResourceRequest.DELETE : "")));
    var resourceRequest = new WLResourceRequest("/adapters/" + adapterName + "/" + path, rrVerb);
    resourceRequest.addHeader("Content-type", "application/json");
    
    return new Promise(
          (resolve, reject) => {
            resourceRequest.send(content).then(
              (response) => {
                resolve(response.responseJSON);
              },
              (error) => {
                console.error("ERROR calling adapter: %o", error);
                reject(error);
              }
            );
          }
    );
    
  }  

}
