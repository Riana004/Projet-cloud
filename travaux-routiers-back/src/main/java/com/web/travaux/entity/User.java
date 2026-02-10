package com.web.travaux.entity;


import jakarta.persistence.*;
import lombok.*;
import java.sql.Timestamp;
@Entity
@Table(name = "users")
@Getter @Setter 
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @JoinColumn(name = "role_id", nullable = false)
    @ManyToOne(fetch = FetchType.EAGER)
    private Role role;

    @Column(name = "is_dirty", nullable = false)
    private boolean isDirty;

    @Column(name = "updated_at", nullable = false, updatable = false)
    private Timestamp updatedAt;


}