/*
 Copyright 2016 IBM Corp.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
package com.ibm.communityhealth;

import com.ibm.mfp.security.checks.base.UserAuthenticationSecurityCheckConfig;

import java.util.Properties;

/**
 * Configuration class
 */
public class AuthenticationAdapterConfig extends UserAuthenticationSecurityCheckConfig {
    private static final String MAX_DEVICES = "maxDevices";
    private static final String ENFORCE_AUTO_LOGOUT = "autoLogout";

    public int getNumOfAllowedDevices() {
        return numOfAllowedDevices;
    }

    public boolean isAutoLogout() {
        return autoLogout;
    }

    private int numOfAllowedDevices = 1;
    private boolean autoLogout = false;

    public AuthenticationAdapterConfig(Properties properties) {
        super(properties);
        this.numOfAllowedDevices = this.getIntProperty(MAX_DEVICES, properties, 1);
        this.autoLogout = Boolean.valueOf(this.getStringProperty(ENFORCE_AUTO_LOGOUT, properties, "true"));
    }
}
