import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import type { User } from '@supabase/supabase-js';
import type { CurrentProfile } from '../auth/useCurrentProfile';
import { colors, radius, spacing, type } from '../theme';

type ProfileScreenProps = {
  onOpenDriverPreview: () => void;
  onSignOut: () => Promise<void>;
  profile: CurrentProfile;
  profileError: string | null;
  signOutError: string | null;
  signingOut: boolean;
  user: User;
};

export function ProfileScreen({ onOpenDriverPreview, onSignOut, profile, profileError, signOutError, signingOut, user }: ProfileScreenProps) {
  const displayName = profile.displayName;
  const initials = useMemo(() => displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CV', [displayName]);
  const workplace = profile.workplaceId ? `Assigned · ${profile.workplaceId.slice(0, 8)}` : 'Not assigned';
  const role = profile.role;

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
      <Text accessibilityRole="header" style={styles.title}>Profile</Text>

      <View style={styles.identityCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={styles.identityCopy}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user.email || 'No email available'}</Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <DetailRow icon="map-pin" label="Workplace" value={workplace} />
        <View style={styles.divider} />
        <DetailRow icon="shield" label="Role" value={role.charAt(0).toUpperCase() + role.slice(1)} />
      </View>

      {profileError ? <Text accessibilityRole="alert" style={styles.error}>{profileError}</Text> : null}
      {signOutError ? <Text accessibilityRole="alert" style={styles.error}>{signOutError}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: signingOut, disabled: signingOut }}
        disabled={signingOut}
        onPress={onSignOut}
        style={({ pressed }) => [styles.logoutButton, (pressed || signingOut) && styles.pressed]}
      >
        <Feather color={colors.paper} name="log-out" size={19} strokeWidth={2.2} />
        <Text style={styles.logoutText}>{signingOut ? 'Logging out…' : 'Log out'}</Text>
      </Pressable>

      {__DEV__ ? (
        <View style={styles.devSection}>
          <Text style={styles.devLabel}>DEVELOPMENT PREVIEW</Text>
          <Pressable accessibilityRole="button" onPress={onOpenDriverPreview} style={styles.devButton}>
            <Feather color={colors.ink} name="truck" size={18} strokeWidth={2.2} />
            <Text style={styles.devButtonText}>Open van crew view</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: 'map-pin' | 'shield'; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}><Feather color={colors.orange} name={icon} size={18} strokeWidth={2.2} /></View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: spacing.xxl },
  eyebrow: { color: colors.orange, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1, marginTop: spacing.sm },
  title: { color: colors.ink, fontSize: type.hero, fontWeight: '900', marginTop: spacing.xs },
  identityCard: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.lg, flexDirection: 'row', marginTop: spacing.xl, padding: spacing.lg },
  avatar: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.pill, height: 56, justifyContent: 'center', width: 56 },
  avatarText: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  identityCopy: { flex: 1, marginLeft: spacing.lg },
  name: { color: colors.paper, fontSize: type.title, fontWeight: '900' },
  email: { color: colors.cream, fontSize: type.label, marginTop: spacing.xs, opacity: 0.78 },
  detailsCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  detailRow: { alignItems: 'center', flexDirection: 'row', minHeight: 72 },
  detailIcon: { alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.pill, height: 38, justifyContent: 'center', width: 38 },
  detailCopy: { flex: 1, marginLeft: spacing.md },
  detailLabel: { color: colors.muted, fontSize: type.tiny, fontWeight: '800' },
  detailValue: { color: colors.ink, fontSize: type.body, fontWeight: '800', marginTop: 2 },
  divider: { backgroundColor: colors.line, height: 1, marginLeft: 50 },
  error: { color: colors.red, fontSize: type.label, marginTop: spacing.md },
  logoutButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.xl, minHeight: 54 },
  logoutText: { color: colors.paper, fontSize: type.body, fontWeight: '900' },
  pressed: { opacity: 0.72 },
  devSection: { borderTopColor: colors.line, borderTopWidth: 1, marginTop: spacing.xxl, paddingTop: spacing.lg },
  devLabel: { color: colors.muted, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1 },
  devButton: { alignItems: 'center', borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.md, minHeight: 48 },
  devButtonText: { color: colors.ink, fontSize: type.label, fontWeight: '800' },
});
