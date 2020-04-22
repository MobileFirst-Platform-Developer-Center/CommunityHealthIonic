/*
 *    Licensed Materials - Property of IBM
 *    5725-I43 (C) Copyright IBM Corp. 2015. All Rights Reserved.
 *    US Government Users Restricted Rights - Use, duplication or
 *    disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
*/

package com.ibm.communityhealth;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import com.ibm.json.java.JSON;
import com.ibm.json.java.JSONArray;
import com.ibm.json.java.JSONArtifact;
import com.ibm.json.java.JSONObject;
import com.ibm.mfp.adapter.api.ConfigurationAPI;
import com.ibm.mfp.adapter.api.OAuthSecurity;

@Path("/appointments")
public class AppointmentsResource {
	/*
	 * For more info on JAX-RS see https://jax-rs-spec.java.net/nonav/2.0-rev-a/apidocs/index.html
	 */
		
	//Define logger (Standard java.util.Logger)
	static Logger logger = Logger.getLogger(AppointmentsResource.class.getName());

	static private JSONArray _appointments = null;

	//Inject the MFP configuration API:
	@Context
	ConfigurationAPI configApi;

	/* Path for method: "<server address>/mfp/api/adapters/Appointments/appointments" */
	@GET
	@Produces("application/json")
	@OAuthSecurity(scope="accessRestricted")
	public Response getAppointments(){
		try {
			logger.info("Retrieving appointment list");
//			if (AppointmentsResource._appointments == null){
				InputStream is = this.getClass().getResourceAsStream("Appointments.json");
				AppointmentsResource._appointments = (JSONArray)JSON.parse(is);
//			}
		} catch (IOException ex){
			logger.log(Level.SEVERE, "Could not load Appointments.json", ex);
			return Response.status(Status.INTERNAL_SERVER_ERROR).build();
		}
		return Response.ok(AppointmentsResource._appointments).build();
	}
	
	@POST
	@Consumes("application/json")
	@Produces("application/json")
	@OAuthSecurity(scope="accessRestricted")
	public Response createAppointment(JSONObject appointment){
		if (appointment.isEmpty()){
			return Response.status(Status.BAD_REQUEST).entity("{\"error\": \"Appointment is required.\"}").build();
		}
		
		Response response = this._loadAppointments();
		if (response != null){
			return response;
		}
		
		if (appointment.get("id") != null){
			Long id = (Long)appointment.get("id");
			int index = this._findAppointmentIndex(id.longValue());
			if (index > -1){
				return Response.status(Status.CONFLICT).entity("{\"error\": \"An appointment with id" + id + " already exists\"}").build();
			}
		} else {
			appointment.put("id", Long.valueOf(System.currentTimeMillis()));
		}
		AppointmentsResource._appointments.add(appointment);
		
		return Response.ok(appointment).build();
	}
	
	@PUT
	@Consumes("application/json")
	@Produces("application/json")
	@OAuthSecurity(scope="accessRestricted")
	public Response updateAppointments(String appointmentsStr){
		JSONArray appointments = null;
		try {
			appointments = (JSONArray)JSON.parse(appointmentsStr);
		} catch (IOException e){
			return Response.status(Status.BAD_REQUEST).entity("{\"error\": \"Appointments must be a JSON array.\"}").build();
		}
		if (appointments == null || appointments.isEmpty()){
			return Response.status(Status.BAD_REQUEST).entity("{\"error\": \"Appointments are required.\"}").build();
		}
		
		Response response = this._loadAppointments();
		if (response != null){
			return response;
		}
		AppointmentsResource._appointments = appointments;
		
		return Response.ok(appointments).build();
	}	
	
	
	@PUT
	@Path("/{appointmentId}")
	@Consumes("application/json")	
	@Produces("application/json")
	@OAuthSecurity(scope="accessRestricted")
	public Response updateAppointment(JSONObject appointment, @PathParam("appointmentId") long id){
		if (appointment == null || id == 0){
			return Response.status(Status.BAD_REQUEST).entity("{\"error\": \"Both appointment and id are required.\"}").build();
		}
		
		Response response = this._loadAppointments();
		if (response != null){
			return response;
		}
		
		appointment.put("id", id);
		int index = this._findAppointmentIndex(id);
		if (index > -1){
			AppointmentsResource._appointments.set(index, appointment);			
		} else {
			return Response.status(Response.Status.NOT_FOUND).entity("{\"error\": \"Resource with id " + id + " not found.\"}").build();
		}

		return Response.ok(appointment).build();
	}
	
	@POST
	@Path("/{appointmentId}/tests")
	@Consumes("application/json")
	@Produces("application/json")
	@OAuthSecurity(scope="accessRestricted_level2")
	public Response createMedicalTest(JSONObject medicalTest, @PathParam("appointmentId") long id){
		if (medicalTest.isEmpty()){
			return Response.status(Status.BAD_REQUEST).entity("{\"error\": \"Medical test information is required.\"}").build();
		}
		
		Response response = this._loadAppointments();
		if (response != null){
			return response;
		}
		
		int appointmentIndex = this._findAppointmentIndex(id);
		if (appointmentIndex == -1){
			return Response.status(Status.NOT_FOUND).entity("{\"error\": \"An appointment with id " + id + "could not be found.\"}").build();
		}
		JSONObject appointment = (JSONObject)AppointmentsResource._appointments.get(appointmentIndex);
		medicalTest.put("id", Long.valueOf(System.currentTimeMillis()));
		JSONArray tests = (JSONArray)appointment.get("tests");
		if (tests == null){
			tests = new JSONArray();
		}
		tests.add(medicalTest);
		
		return Response.ok(medicalTest).build();
	}	

	@POST
	@Path("/{appointmentId}/medications")
	@Consumes("application/json")
	@Produces("application/json")
	@OAuthSecurity(scope="accessRestricted_level2")
	public Response addMedication(JSONObject medication, @PathParam("appointmentId") long id){
		if (medication.isEmpty()){
			return Response.status(Status.BAD_REQUEST).entity("{\"error\": \"Medication information is required.\"}").build();
		}
		
		Response response = this._loadAppointments();
		if (response != null){
			return response;
		}
		
		int appointmentIndex = this._findAppointmentIndex(id);
		if (appointmentIndex == -1){
			return Response.status(Status.NOT_FOUND).entity("{\"error\": \"An appointment with id " + id + "could not be found.\"}").build();
		}
		JSONObject appointment = (JSONObject)AppointmentsResource._appointments.get(appointmentIndex);
		medication.put("id", Long.valueOf(System.currentTimeMillis()));
		JSONArray medications = (JSONArray)appointment.get("medications");
		if (medications == null){
			medications = new JSONArray();
		}
		medications.add(medication);
		
		return Response.ok(medication).build();
	}	
	
	
	private Response _loadAppointments() {
		try {
			if (AppointmentsResource._appointments == null){
				logger.info("Loading appointment list from file");
				InputStream is = this.getClass().getResourceAsStream("Appointments.json");
				AppointmentsResource._appointments = (JSONArray)JSON.parse(is);
			}
		} catch (IOException ex){
			logger.log(Level.SEVERE, "Could not load Appointments.json", ex);
			return Response.status(Status.INTERNAL_SERVER_ERROR).build();
		}
		return null;
	}
	
	private int _findAppointmentIndex(long id){
		for (int i=0; i< AppointmentsResource._appointments.size(); i++){
			if (Long.valueOf(id).equals(((JSONObject)AppointmentsResource._appointments.get(i)).get("id"))){
				return i;
			}
		}
		return -1;
	}
		
//	/* Path for method: "<server address>/mfp/api/adapters/Appointments/users/{username}" */
//	@GET
//	@Path("/{username}")
//	public String helloUser(@PathParam("username") String name){
//		return "Hello " + name;
//	}
//	
//	/* Path for method: "<server address>/mfp/api/adapters/Appointments/users/helloUserQuery?name=value" */
//	@GET
//	@Path("/helloUserQuery")
//	public String helloUserQuery(@QueryParam("username") String name){
//		return "Hello " + name;
//	}
//	
//
//	
//	/* Path for method: "<server address>/mfp/api/adapters/Appointments/users/{first}/{middle}/{last}?age=value" */
//	@POST
//	@Path("/{first}/{middle}/{last}")
//	public String enterInfo(@PathParam("first") String first, @PathParam("middle") String middle, @PathParam("last") String last,
//			@QueryParam("age") int age, @FormParam("height") String height, @HeaderParam("Date") String date){
//		return first +" "+ middle + " " + last + "\n" +
//				"Age: " + age + "\n" +
//				"Height: " + height + "\n" +
//				"Date: " + date;
//	}
//	
//	/* Path for method: "<server address>/mfp/api/adapters/Appointments/users/newUsers" */
//	@PUT
//	@Path("/newUsers")
//	public String newUsers(@FormParam("username") List<String> users){
//		if(users!=null && users.size() != 0){
//			String usersTemp = "";
//			int index = 0;
//			for (String user : users) {
//				usersTemp += " " +user;
//				if(index < users.size() - 1 && users.size() != 2) usersTemp += ",";
//				if(++index == users.size() -1 && users.size() != 1) usersTemp += " and";
//			}
//			return "Hello" + usersTemp;
//		}
//		
//		return "Hello";
//	}
//
//
//	/* Path for method: "<server address>/mfp/api/adapters/Appointments/users/helloUserBody" */
//	@POST
//	@Consumes("application/json")
//	@Path("/helloUserBody")
//	public String testUser(@HeaderParam("Content-Type") String type,  JSONObject json) throws IOException{
//		return "Hello " + json.get("first") + " " + json.get("middle") + " " + json.get("last");
//	}
//
//
//
//	/* Path for method: "<server address>/mfp/api/adapters/Appointments/users/prop" */
//	@GET
//	@Path("/prop")
//	public Response getPropertyValue(@QueryParam("propertyName") String propertyName) {
//		//Get the value of the property:
//		String value = configApi.getPropertyValue(propertyName);
//
//		return Response.ok("The value of " + propertyName + " is: " + value).build();
//	}

}
