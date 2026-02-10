package com.web.travaux.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.FirebaseAuthException;
import com.web.travaux.entity.User;
import org.springframework.stereotype.Service;

@Service
public class FirebaseAuthService {

    public void createFirebaseUser(User user) throws FirebaseAuthException {

        UserRecord.CreateRequest request =
            new UserRecord.CreateRequest()
                .setEmail(user.getEmail())
                .setPassword(user.getPassword());

        FirebaseAuth.getInstance().createUser(request);
    }
}
