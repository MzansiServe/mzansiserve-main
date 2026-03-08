import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import apiClient, { getImageUrl } from '../../api/client';
import { ArrowLeft, Star, MapPin, ShieldCheck, Mail, Phone, Briefcase, CalendarCheck, MessageSquare } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../../constants/Theme';
import { Typography } from '../../components/UI/Typography';
import { Button } from '../../components/UI/Button';

export default function ProviderDetails() {
    const { id, category } = useLocalSearchParams<{ id: string, category: string }>();
    const router = useRouter();

    const { data: fetchResult, isLoading, error } = useQuery({
        queryKey: ['provider', category, id],
        queryFn: async () => {
            const endpoint = category === 'professionals'
                ? `/profile/professional/${id}`
                : `/profile/service-provider/${id}`;
            const res = await apiClient.get(endpoint);
            return res.data?.data || res.data;
        },
        enabled: !!id && !!category
    });

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Typography variant="body" color={COLORS.gray[500]} style={{ marginTop: 12 }}>
                    Loading profile...
                </Typography>
            </View>
        );
    }

    if (error || !fetchResult) {
        return (
            <View style={styles.center}>
                <Typography variant="h3" color={COLORS.gray[800]}>Profile Unavailable</Typography>
                <Typography variant="body" color={COLORS.gray[500]} style={{ marginTop: 8, marginBottom: 24, textAlign: 'center', paddingHorizontal: 32 }}>
                    We couldn't find this provider. Ask them if they are still active.
                </Typography>
                <Button title="Go Back" onPress={() => router.back()} />
            </View>
        );
    }

    const profile = category === 'professionals' ? fetchResult.professional : fetchResult.provider;
    const services = fetchResult.services || [];
    const data = profile?.data || {};

    const fullName = category === 'professionals'
        ? `${data.full_name || ''} ${data.surname || ''}`.trim() || profile?.full_name || profile?.name
        : data.business_name || `${data.full_name || ''} ${data.surname || ''}`.trim() || profile?.full_name || profile?.name || "Service Provider";

    const avatarUrl = profile?.profile_image_url
        ? getImageUrl(profile.profile_image_url)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

    const bannerUrl = "https://images.unsplash.com/photo-1541888081628-912235c4eb5e?q=80&w=600&auto=format&fit=crop";

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Banner */}
                <View style={styles.bannerContainer}>
                    <Image source={{ uri: bannerUrl }} style={styles.banner} />
                    <View style={styles.bannerOverlay} />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft color={COLORS.white} size={24} />
                    </TouchableOpacity>
                </View>

                {/* Profile Info Header */}
                <View style={styles.profileHeader}>
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    <View style={{ flex: 1, marginLeft: SPACING.lg, justifyContent: 'center' }}>
                        <Typography variant="h2" weight="bold">{fullName}</Typography>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            {profile?.is_approved && (
                                <View style={styles.verifiedBadge}>
                                    <ShieldCheck size={12} color={COLORS.primary} strokeWidth={3} />
                                    <Typography variant="caption" color={COLORS.primary} weight="bold" style={{ marginLeft: 4 }}>VERIFIED</Typography>
                                </View>
                            )}
                            <Typography variant="label" color={COLORS.gray[500]} style={{ marginLeft: profile?.is_approved ? 8 : 0 }}>
                                {category === 'professionals' ? 'Professional' : 'Partner'}
                            </Typography>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <Button
                        title="Book Now"
                        fullWidth
                        style={{ flex: 1, marginRight: SPACING.md }}
                        icon={<CalendarCheck size={18} color={COLORS.white} />}
                        onPress={() => router.push({ pathname: '/book/[id]', params: { id: id as string, category: category as string } })}
                    />
                    <TouchableOpacity style={styles.iconActionBtn}>
                        <MessageSquare size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoRow}>
                        <Star color="#FBBF24" fill="#FBBF24" size={20} />
                        <Typography variant="body" weight="bold" style={{ marginLeft: 12 }}>4.8 Rating (120 Reviews)</Typography>
                    </View>
                    {data.city && (
                        <View style={styles.infoRow}>
                            <MapPin color={COLORS.gray[400]} size={20} />
                            <Typography variant="body" style={{ marginLeft: 12 }}>Serves {data.city} and surrounds</Typography>
                        </View>
                    )}
                    {category === 'professionals' && data.highest_qualification && (
                        <View style={styles.infoRow}>
                            <Briefcase color={COLORS.gray[400]} size={20} />
                            <Typography variant="body" style={{ marginLeft: 12 }}>{data.highest_qualification}</Typography>
                        </View>
                    )}
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Typography variant="subtitle" weight="bold" style={{ marginBottom: SPACING.md }}>About</Typography>
                    <Typography variant="body" color={COLORS.gray[600]} style={{ lineHeight: 24 }}>
                        {data.bio || data.description || "No description provided by the provider yet. They specialize in offering high-quality services to clients in their area."}
                    </Typography>
                </View>

                {/* Services Section */}
                <View style={styles.section}>
                    <Typography variant="subtitle" weight="bold" style={{ marginBottom: SPACING.md }}>Services Offered</Typography>
                    {services.length > 0 ? services.map((svc: any, idx: number) => (
                        <View key={idx} style={styles.serviceCard}>
                            <View style={{ flex: 1 }}>
                                <Typography variant="body" weight="bold">{svc.name}</Typography>
                                {svc.description && (
                                    <Typography variant="label" color={COLORS.gray[500]} style={{ marginTop: 4 }}>{svc.description}</Typography>
                                )}
                            </View>
                            {svc.hourly_rate ? (
                                <View style={{ alignItems: 'flex-end', marginLeft: SPACING.md }}>
                                    <Typography variant="caption" color={COLORS.gray[400]} weight="bold" style={{ textTransform: 'uppercase' }}>Rate</Typography>
                                    <Typography variant="h3" color={COLORS.primary} weight="bold">R{svc.hourly_rate}<Typography variant="caption" color={COLORS.gray[500]}>/hr</Typography></Typography>
                                </View>
                            ) : (
                                <Typography variant="label" color={COLORS.gray[500]} weight="bold">Quote</Typography>
                            )}
                        </View>
                    )) : (
                        <Typography variant="body" color={COLORS.gray[500]}>No specific services listed.</Typography>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        paddingBottom: SPACING.xxl,
    },
    bannerContainer: {
        height: 250,
        position: 'relative',
        backgroundColor: COLORS.gray[800],
    },
    banner: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    backButton: {
        position: 'absolute',
        top: 60, // Safe area approx
        left: SPACING.lg,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeader: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        marginTop: -50,
        alignItems: 'flex-end',
        marginBottom: SPACING.xl,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 30,
        borderWidth: 4,
        borderColor: COLORS.white,
        backgroundColor: COLORS.white,
        ...SHADOWS.md,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: SIZES.radius.full,
    },
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    iconActionBtn: {
        width: 56,
        height: 56,
        borderRadius: SIZES.radius.md,
        borderWidth: 2,
        borderColor: COLORS.primary + '30',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '05',
    },
    infoGrid: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[100],
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    section: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[100],
    },
    serviceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: COLORS.gray[50],
        borderRadius: SIZES.radius.md,
        marginBottom: SPACING.md,
    },
});
