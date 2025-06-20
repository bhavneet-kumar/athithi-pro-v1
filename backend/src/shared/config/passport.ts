import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';

import { Agency } from '../models/agency.model';
import { Role } from '../models/role.model';
import { User } from '../models/user.model';

import { config } from './index';

// Local Strategy for username/password login
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done) => {
      try {
        const user = await User.findOne({ email }).populate('role');
        if (!user) {
          return done(new Error('Invalid credentials'));
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(new Error('Invalid credentials'));
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

// JWT Strategy for token authentication
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.secret,
      algorithms: ['RS256'],
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select('-password');
        if (!user) {
          return done(new Error('User not found'));
        }

        const agency = await Agency.findById(user.agency);
        if (!agency) {
          return done(new Error('Agency not found'));
        }

        const role = await Role.findById(user.role);
        if (!role) {
          return done(new Error('Role not found'));
        }

        return done(null, {
          id: user.id.toString(),
          agency: user.agency.toString(),
          agencyCode: agency.code.toString(),
          role_type: {
            type: role.type as 'super_admin' | 'manager' | 'agent',
          },
          role,
        });
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export { default } from 'passport';
