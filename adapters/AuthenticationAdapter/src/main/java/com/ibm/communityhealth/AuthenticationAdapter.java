package com.ibm.communityhealth;

import com.ibm.mfp.security.checks.base.CredentialsValidationSecurityCheck;
import com.ibm.mfp.security.checks.base.UserAuthenticationSecurityCheck;
import com.ibm.mfp.server.registration.external.model.AuthenticatedUser;
import com.ibm.mfp.server.registration.external.model.ClientData;
import com.ibm.mfp.server.security.external.checks.AuthorizationResponse;
import com.ibm.mfp.server.security.external.checks.IntrospectionResponse;
import com.ibm.mfp.server.security.external.checks.impl.ExternalizableSecurityCheck;
import com.ibm.mfp.server.security.external.resource.ClientSearchCriteria;

import javax.servlet.http.HttpServletRequest;
import java.util.*;


public class AuthenticationAdapter extends UserAuthenticationSecurityCheck {
//Constants
    private static final String ENFORCE_LOGOUT_ATTRIBUTE = "enforceLogoutAttribute";
    private static final String USER_NAME_ATTRIBUTE = "userName";
    private static final String CONTEXT_UUID = "contextUUID";
    private static final String USERNAME = "username";
    private static final String PASSWORD = "password";
    private static final String REMEMBER_ME = "rememberMe";
    private static final String ERROR_MSG = "errorMsg";
    private static final String REMAINING_ATTEMPTS = "remainingAttempts";

    private String userId, displayName, errorMsg;
 private boolean rememberMe = false;

    @Override
    protected AuthenticatedUser createUser() {
        return new AuthenticatedUser(userId, displayName, this.getName());
    }

    @Override
    public AuthenticationAdapterConfig createConfiguration(Properties properties) {
        return new AuthenticationAdapterConfig(properties);
    }

    @Override
    public void authorize(Set<String> scope, Map<String, Object> credentials, HttpServletRequest request, AuthorizationResponse response) {
        super.authorize(scope, credentials, request, response);
        if (getState().equals(STATE_EXPIRED) || getState().equals(STATE_ATTEMPTING)){
            cleanRegistrationAttributes();
        }
    }

    @Override
    protected boolean validateCredentials(Map<String, Object> credentials) {
        if(credentials!=null && credentials.containsKey("username") && credentials.containsKey("password")){
            String username = credentials.get("username").toString();
            String password = credentials.get("password").toString();

            setCurrentClientDataUUID();
            cleanRegistrationAttributes();


              //Check if the user allowed to continue with login process
          if (!isCurrentDeviceAllowedToLogin(username)) {
              errorMsg = "you've reached the maximum of allowed devices";
              return false;
          }
            if(!username.isEmpty() && !password.isEmpty() && (username.equals(password) || password.equals("password"))) {

              userId = username;
              displayName = username;



                //Optional RememberMe
                if(credentials.containsKey(REMEMBER_ME) ){
                    rememberMe = Boolean.valueOf(credentials.get(REMEMBER_ME).toString());
                }
                errorMsg = null;

                registrationContext.getRegisteredPublicAttributes().put(USER_NAME_ATTRIBUTE,username);
                return true;
            }
            else {
                errorMsg = "Wrong Credentials";
            }
        }
        else{
            errorMsg = "Credentials not set properly";
        }
        return false;
    }

    /**
     * Check if the current device is able to login
     * @param userName - the userName to look for
     * @return true is current device can login
     */
    private boolean isCurrentDeviceAllowedToLogin(String userName) {
        boolean isAllowedToContinueWithLogin;
        List<ClientData> loggedInDevices = getLoggedInDevices(userName);
        AuthenticationAdapterConfig authenticationAdapterConfig = (AuthenticationAdapterConfig) getConfiguration();

        if (loggedInDevices.size() < authenticationAdapterConfig.getNumOfAllowedDevices()) {
            // There is no other logged in devices, so it's ok to continue with login process
            isAllowedToContinueWithLogin = true;
        } else {
            //Check if need to logout other device or block the current login
            if (authenticationAdapterConfig.isAutoLogout()) {
                loggedInDevices.get(0).getPublicAttributes().put(ENFORCE_LOGOUT_ATTRIBUTE, true);
                isAllowedToContinueWithLogin = true;
            } else {
                isAllowedToContinueWithLogin = false;
            }
        }
        return isAllowedToContinueWithLogin;
    }

    @Override
    public void logout() {
        cleanRegistrationAttributes();
        super.logout();
    }

    /**
     * Return all logged in client data for the for a username
     * @param userName - the username to look for
     * @return list of logged in devices
     */
    private List<ClientData> getLoggedInDevices(String userName) {
        ClientSearchCriteria userNameClientSearchCriteria =  new ClientSearchCriteria ().byAttribute(USER_NAME_ATTRIBUTE, userName);
        List<ClientData> allUserDevices = registrationContext.findClientRegistrationData(userNameClientSearchCriteria);
        List<ClientData> loggedInDevices = new ArrayList<>();

        for (ClientData clientData :  allUserDevices) {
            if (!isMyClientId(clientData)) {
                AuthenticatedUser authenticatedUser = clientData.getUsers().get(this.getName());

                if (clientData.isEnabled() && authenticatedUser != null && authenticatedUser.getId().equals(userName)) {
                    AuthenticationAdapterConfig authenticationAdapterConfig = (AuthenticationAdapterConfig) this.getConfiguration();
                    long expirationInSec = rememberMe ? authenticationAdapterConfig.rememberMeDurationSec : authenticationAdapterConfig.successStateExpirationSec;
                    long now = System.currentTimeMillis();
                    long authenticatedAt = authenticatedUser.getAuthenticatedAt();

                    if (now - authenticatedAt < (expirationInSec * 1000)) {
                        loggedInDevices.add(clientData);
                    }
                }
            }
        }
        return loggedInDevices;
    }

    @Override
    public void introspect(Set<String> scope, IntrospectionResponse response) {
        Boolean enforceLogout = registrationContext.getRegisteredPublicAttributes().get(ENFORCE_LOGOUT_ATTRIBUTE);
        if (enforceLogout != null && enforceLogout) {
            setState(STATE_EXPIRED);
            cleanRegistrationAttributes();
        } else {
            super.introspect(scope, response);
        }
    }

    @Override
    protected Map<String, Object> createChallenge() {
        Map challenge = new HashMap();
        challenge.put("errorMsg",errorMsg);
        challenge.put("remainingAttempts",getRemainingAttempts());
        return challenge;
    }

    @Override
    protected boolean rememberCreatedUser() {
        return rememberMe;
    }

    /**
     * Check if the client data is belong to the current registrationContext
     * @param clientData - clientData to be check
     * @return true if that client is the same as the current client data
     */
    private boolean isMyClientId (ClientData clientData) {
        String currentContextUUID = registrationContext.getRegisteredPublicAttributes().get(CONTEXT_UUID);
        String contextUUID = clientData.getPublicAttributes().get(CONTEXT_UUID);
        return currentContextUUID.equals(contextUUID);
    }


    /**
     * Set UUID for the client data. Used to identifying the current client data
     */
    private void setCurrentClientDataUUID() {
        if (registrationContext.getRegisteredPublicAttributes().get(CONTEXT_UUID) == null){
            registrationContext.getRegisteredPublicAttributes().put(CONTEXT_UUID, UUID.randomUUID());
        }
    }

    private void cleanRegistrationAttributes() {
        registrationContext.getRegisteredPublicAttributes().delete(USER_NAME_ATTRIBUTE);
        registrationContext.getRegisteredPublicAttributes().delete(ENFORCE_LOGOUT_ATTRIBUTE);
    }
}
