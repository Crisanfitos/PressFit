import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    currentExerciseCard: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    currentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    currentCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    currentExerciseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    currentExerciseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    currentExerciseMetaText: {
        fontSize: 13,
    },
    contentFlex: {
        flex: 1,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    filtersWrapper: {
        marginBottom: 6,
    },
    filterChipsContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    candidateCard: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
    },
    candidateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    candidateTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    candidateSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        marginTop: 8,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    bottomBarLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
    },
    bottomBarSelected: {
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    step2Container: {
        padding: 16,
        paddingBottom: 40,
    },
    step2Heading: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    step2Description: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 16,
    },
    comparisonGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    compareCard: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 12,
        minHeight: 130,
    },
    compareBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 8,
    },
    compareBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    compareCardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    compareCardSubtitle: {
        fontSize: 12,
    },
    compareDivider: {
        height: 1,
        marginVertical: 8,
    },
    compareCardInfo: {
        fontSize: 11,
    },
    arrowDivider: {
        paddingHorizontal: 6,
    },
    setsConfigCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 24,
    },
    setsConfigTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    setsConfigSubtitle: {
        fontSize: 12,
        marginBottom: 16,
    },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    counterButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterValueContainer: {
        alignItems: 'center',
        minWidth: 80,
    },
    counterValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    counterUnit: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    step2Actions: {
        gap: 12,
    },
    secondaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    finishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
    },
    finishButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
