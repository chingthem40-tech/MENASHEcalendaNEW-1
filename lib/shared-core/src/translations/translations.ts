export type Lang = "en" | "tk";

export interface SharedTranslations {
  /* ── Navigation ── */
  navHome: string;
  navCalendar: string;
  navZmanim: string;
  navCommunity: string;
  navTorah: string;
  navSettings: string;
  navSiddur: string;
  navJourney: string;
  libraryBrowseCategories: string;
  libraryTitle: string;
  libraryBooksAvailable: string;
  librarySearchPlaceholder: string;
  libraryVoiceSearch: string;
  libraryFilter: string;
  libraryBack: string;
  libraryFilterTitle: string;
  libraryFilterAll: string;
  libraryFilterFree: string;
  libraryFilterPremium: string;
  libraryTotalBooks: string;
  libraryInLibrary: string;
  libraryPremium: string;
  libraryProContent: string;
  libraryFree: string;
  libraryAvailableToRead: string;
  libraryFreeBadge: string;
  libraryProBadge: string;
  libraryLocked: string;
  libraryDownloaded: string;
  libraryNew: string;
  libraryRecent: string;
  libraryOpen: string;
  libraryLockedDescription: string;
  libraryNoBooksFound: string;
  libraryNoBooksInCategory: string;
  libraryTrySearch: string;
  libraryCheckBack: string;
  libraryBookActions: string;
  libraryClose: string;
  libraryCategoryAll: string;
  libraryCategorySiddur: string;
  libraryCategoryTehillim: string;
  libraryCategoryTorahPortions: string;
  libraryCategoryDailyStudy: string;
  libraryCategoryPrayerBooks: string;
  libraryCategoryHebrewLearning: string;
  libraryCategoryCommunity: string;
  libraryCategoryPremium: string;

  /* ── Journey ── */
  journeyGreeting: string;
  journeySummaryTitle: string;
  journeyStudyCard: string;
  journeyMemorialCard: string;
  journeyCommunityCard: string;
  journeyCalendarCard: string;
  journeyStartYourJourney: string;
  journeyContinueTitle: string;
  journeyContinueStudy: string;
  journeyContinueCalendar: string;
  journeyContinueMemorial: string;
  journeyContinueAI: string;
  journeyBookmarksTitle: string;
  journeyBookmarksEmpty: string;
  journeyBookmarksEmptySub: string;
  journeyReflectionTitle: string;

  /* ── Journey × Census (SPR-P006A) ── */
  journeyCensusSectionTitle: string;
  journeyCensusMilestoneTitle: string;
  journeyCensusMilestoneSubtitle: string;
  journeyCensusStartCta: string;
  journeyCensusStatusTitle: string;
  journeyCensusFamiliesLabel: string;
  journeyCensusAliyahTitle: string;
  journeyCensusAliyahSubtitle: string;
  journeyCensusUnavailable: string;

  /* ── Journey × Intelligent Integration (SPR-X001) ── */
  journeyTodaysLearning: string;
  journeyLearningGroupLabel: string;
  journeyNextSession: string;
  journeyContinueLearning: string;
  journeyNoLearningToday: string;
  journeyTodaysSacredTime: string;
  journeyNextPrayer: string;
  journeyOpenZmanim: string;
  journeyNoZmanim: string;
  journeyCommunityToday: string;
  journeyNextEvent: string;
  journeyPrayerRequests: string;
  journeyLatestAnnouncement: string;
  journeyNoEvents: string;
  journeyOpenCommunity: string;
  journeyFamilyJourney: string;
  journeyMemorialReminder: string;
  journeyVisitSanctuary: string;
  journeyNoMemorials: string;
  journeyMemorialsLearning: string;
  journeyTodaysRecommendation: string;
  journeyAllPrayersDone: string;
  journeyAnonymous: string;
  journeyNoPrayerRequests: string;
  journeyNoAnnouncements: string;
  journeyMemorialSingular: string;
  journeyMemorialPlural: string;

  /* ── Census — Family Head screen ── */
  censusFamilyHeadTitle: string;
  censusGoBack: string;
  censusSaveDraft: string;
  censusStep1of3: string;
  censusSectionIdentity: string;
  censusSectionFamily: string;
  censusSectionAliyah: string;
  censusSectionPassport: string;
  censusFieldSurname: string;
  censusFieldNamePassport: string;
  censusFieldHebrewName: string;
  censusFieldSex: string;
  censusFieldMaritalStatus: string;
  censusFieldDob: string;
  censusFieldFatherName: string;
  censusFieldMotherName: string;
  censusFieldJudaismDate: string;
  censusFieldAliyahStatus: string;
  censusFieldPassportNo: string;
  censusFieldPassportIssue: string;
  censusFieldPassportExpiry: string;
  censusPrivacyNote: string;
  censusSubmitCta: string;
  censusSubmitTitle: string;
  censusSubmitBody: string;
  censusSaveDraftTitle: string;
  censusSaveDraftBody: string;
  censusValidationTitle: string;
  censusNameRequired: string;
  censusErrorTitle: string;
  censusErrorBody: string;
  censusErrSurnameRequired: string;
  censusErrDobFormat: string;
  censusErrDobFuture: string;
  censusErrYearFormat: string;
  censusErrYearFuture: string;
  censusErrPassportDateFormat: string;
  censusErrExpiryAfterIssue: string;
  censusDiscardDraft: string;
  censusDiscardDraftTitle: string;
  censusDiscardDraftBody: string;
  censusDiscardDraftConfirm: string;
  censusAliyahInIsrael: string;
  censusAliyahAwaiting: string;
  censusAliyahUnknown: string;
  censusSexMale: string;
  censusSexFemale: string;
  censusSelectPlaceholder: string;
  censusMaritalSingle: string;
  censusMaritalMarried: string;
  censusMaritalDivorced: string;
  censusMaritalWidowed: string;
  censusSubmitScreenTitle: string;
  censusStep4of4: string;
  censusAlmostDone: string;
  censusReadyToSubmit: string;
  censusReadBeforeSubmit: string;
  censusPeople: string;
  censusMembers: string;
  censusBullet1: string;
  censusBullet2: string;
  censusBullet3: string;
  censusBullet4: string;
  censusSubmissionFailed: string;
  censusSubmissionFailedMsg: string;
  censusRetry: string;
  censusBackToReview: string;
  censusPrevious: string;
  censusConfirmSubmit: string;

  /* ── Home ── */
  homeToday: string;
  homeHebrewDate: string;
  homeGregorian: string;
  homeHebrewYear: string;
  homeSacredCalendar: string;
  homeZmanim: string;
  homeViewAll: string;
  homeSunrise: string;
  homeSunset: string;
  homeNightfall: string;
  homeCandleLighting: string;
  homeHavdalah: string;
  homeHavdalahAt: string;
  homeHavdalahTonight: string;
  homeTodayShabbat: string;
  homeUpcomingShabbat: string;
  homeShabbatShalom: string;
  homeShabbatInProgress: string;
  homeShavuaTov: string;
  homeUntilHavdalah: string;
  homeUntilCandleLighting: string;
  homeUntilNextShabbat: string;
  homeQuickTools: string;
  homeKeyZmanim: string;
  homeWeeklyParasha: string;
  homeParashah: string;
  homeUpcomingHoliday: string;
  homeUpcomingHolidays: string;
  homeNoHolidays: string;
  homeNextPrayer: string;
  homeNoPrayer: string;
  homeTodayHoliday: string;
  homeChagSameach: string;
  homeDafYomi: string;
  homeDafYomiToday: string;
  homeOmer: string;
  homeOmerWeeks: string;
  homeOmerDays: string;
  homeDailyTorah: string;
  homeReadMore: string;
  homeShowLess: string;
  homeShare: string;
  homeCommunityTitle: string;
  homeCommunityDesc: string;
  homeCensusTitle: string;
  homeCensusDesc: string;
  homeMoreTools: string;

  /* ── Home Premium (SPR-M005) ── */
  homeGoodMorning: string;
  homeGoodAfternoon: string;
  homeGoodEvening: string;
  homePrayerTimesTitle: string;
  homeDawn: string;
  homeLatestShema: string;
  homeNoon: string;
  homeMincha: string;
  homePlag: string;
  homeTzais: string;
  homeViewZmanim: string;
  homeShabbatTitle: string;
  homeMemorialTitle: string;
  homeMemorialDesc: string;
  homeOpenSanctuary: string;
  homeAITitle: string;
  homeAIDesc: string;
  homeAskRavMenashe: string;
  homeInsightTitle: string;
  homeQuickActionsTitle: string;

  /* ── Home Premium additional (SPR-M005A) ── */
  homeTodaysFocusLabel: string;
  homeCandleLightingToday: string;
  homePrepareForShabbat: string;
  homeTodaysZmanimLabel: string;
  homeAllTimesLocal: string;
  homeMinchaGedola: string;
  homeReadSummary: string;
  homeOpenDafYomi: string;
  homeViewAllHolidays: string;
  homeGoPremium: string;
  homeSupportMission: string;
  homeViewBenefits: string;
  /* ── Premium Screen (MEP-301) ── */
  premiumTitle: string;
  premiumTagline: string;
  premiumHeroSubtitle: string;
  premiumComingSoon: string;
  premiumComingSoonBody: string;
  premiumContactSupport: string;
  premiumFreeLabel: string;
  premiumProLabel: string;
  premiumCompareTitle: string;
  premiumFeaturesTitle: string;
  premiumBack: string;
  premiumEarlyAccess: string;
  homeSanctuaryAction: string;
  homeStudyAction: string;
  homeMoreAction: string;
  homeMemorialTagline: string;
  homeAITagline: string;
  homeUntilNextShabbatLabel: string;

  /* ── Home Vision Sprint (SPR-M007) ── */
  homeSacredTimeLabel: string;
  homeNowLabel: string;
  homeLearningLabel: string;
  homeCommunityPreviewTitle: string;
  homeCommunityPreviewDesc: string;
  homeCommunityPreviewCta: string;
  homeEnterSanctuary: string;

  /* ── Hero week strip + glance timeline ── */
  homeThisWeekLabel: string;
  homeCalendarLink: string;
  homeGlanceLabel: string;
  homeFullZmanimLink: string;
  homeReadLink: string;

  /* ── Settings ── */
  settingsTitle: string;
  settingsAppearance: string;
  settingsTheme: string;
  settingsDarkMode: string;
  settingsDarkOn: string;
  settingsDarkOff: string;
  settingsShowHebrew: string;
  settingsLanguage: string;
  settingsLanguageHint: string;
  settingsEditTranslations: string;
  settingsEditTranslationsHint: string;
  settingsLocation: string;
  settingsCity: string;
  settingsCityHint: string;
  settingsTimezone: string;
  settingsNotifications: string;
  settingsCandleLighting: string;
  settingsHavdalah: string;
  settingsShema: string;
  settingsPrayers: string;
  settingsHoliday: string;
  settingsHolidays: string;
  settingsParasha: string;
  settingsOmer: string;
  settingsShabbatDigest: string;
  settingsYahrtzeit: string;
  settingsLeadTime: string;
  settingsLeadTimeHint: string;
  settingsBgPush: string;
  settingsBgPushDesc: string;
  settingsBgPushDescUnsupported: string;
  settingsEnablePush: string;
  settingsEnablingPush: string;
  settingsTestPush: string;
  settingsTestSent: string;
  settingsDisablePush: string;
  settingsPushActive: string;
  settingsTools: string;
  settingsTahara: string;
  settingsTaharaSub: string;
  settingsYartzeitCalc: string;
  settingsYartzeitSub: string;
  settingsBirthday: string;
  settingsBirthdaySub: string;
  settingsCommunity: string;
  settingsCommunitySub: string;
  settingsCensus: string;
  settingsCensusSub: string;
  settingsUpgrade: string;
  settingsUpgradeSub: string;
  settingsAccount: string;
  settingsEditProfile: string;
  settingsEditProfileHint: string;
  settingsSignOut: string;
  /* ── Edit Profile screen ── */
  profileTitle: string;
  profileVisibleIn: string;
  profileDisplayName: string;
  profileCongregation: string;
  profileRole: string;
  profileCountry: string;
  profileCity: string;
  profileBio: string;
  profileBioPlaceholder: string;
  profileUploadPhoto: string;
  profileChangePhoto: string;
  profileRemovePhoto: string;
  profilePhotoHint: string;
  profilePhotoTooBig: string;
  profileChooseEmoji: string;
  profileNameRequired: string;
  profileSaveBtn: string;
  profileSaving: string;
  profileSaved: string;
  profileVisibility: string;
  settingsVersion: string;
  settingsNotifBlocked: string;
  settingsNotifBlockedSub: string;
  settingsNotifUnsupported: string;
  settingsNotifActive: string;

  /* ── Community FAB ── */
  fabTitle: string;
  fabAnnouncements: string;
  fabCommunityEvents: string;
  fabCommunityMemorial: string;
  fabTorahWisdom: string;
  fabPrayerBoard: string;
  fabTorahTracker: string;

  /* ── Sacred Study (Mobile) ── */
  sacredStudyBeginJourney: string;
  sacredStudyStudyPaths: string;
  sacredStudyJewishCalendar: string;
  sacredStudyBookmarks: string;
  sacredStudyRecentlySaved: string;
  sacredStudyNoBookmarks: string;
  sacredStudyLearningJourney: string;
  sacredStudyStudyDays: string;
  sacredStudyLessonsCompleted: string;
  sacredStudyThisWeek: string;

  /* ── Sacred Memory (Mobile) ── */
  sacredMemoryTitle: string;
  sacredMemorySubtitle: string;
  sacredMemoryTodaysRemembrance: string;
  sacredMemoryNoRemembrance: string;
  sacredMemoryMyFamilyMemorials: string;
  sacredMemoryNoFamilyMemorials: string;
  sacredMemoryLightCandle: string;
  sacredMemoryLightCandleDesc: string;
  sacredMemoryLightCandleCta: string;
  sacredMemoryRecentCandles: string;
  sacredMemoryNoRecentCandles: string;
  sacredMemoryPrayerReflection: string;
  sacredMemoryCommunityMemorial: string;
  sacredMemoryViewCommunity: string;
  sacredMemoryCandlesLit: string;
  sacredMemoryLearningNow: string;
  sacredMemoryEnterSanctuary: string;
  sacredMemoryEnterSanctuaryCta: string;
  sacredMemoryEnterSanctuaryDesc: string;
  sacredMemoryEntryLabel: string;
  sacredMemoryEntrySub: string;

  /* ── Community Hub (SPR-M009) ── */
  commHubTitle: string;
  commHubSubtitle: string;
  commStatPopulation: string;
  commStatAliyah: string;
  commStatParshiyot: string;
  commIsaiahQuote: string;
  commIsaiahRef: string;
  commEnterSanctuary: string;
  commAnnouncementsTitle: string;
  commAnnouncementsSeeAll: string;
  commAnnouncementsPinned: string;
  commAnnouncementsEmpty: string;
  commPrayerTitle: string;
  commPrayerSeeAll: string;
  commPrayerAmen: string;
  commPrayerEmpty: string;
  commPrayerSubmit: string;
  commMemorialsTitle: string;
  commMemorialsSeeAll: string;
  commMemorialsEmpty: string;
  commMemorialsCandlesLit: string;
  commMemorialsLearning: string;
  commEventsTitle: string;
  commEventsSoon: string;
  commOrgsTitle: string;
  commOrgsSeeAll: string;
  commOrgsScreenDesc: string;
  commOrgsStatOrgs: string;
  commOrgVisitSite: string;
  commOrgHotlineDesc: string;
  commOrgNewsletterDesc: string;
  commOrgTorahClassesDesc: string;
  commOrgConnectDesc: string;
  dirTitle: string;
  dirSeeAll: string;
  dirHubCardDesc: string;
  dirMembersWorldwide: string;
  dirSearchPlaceholder: string;
  dirNoMembers: string;
  dirNoMatch: string;
  dirBeFirst: string;
  dirConnect: string;
  dirClose: string;
  dirMemberSince: string;
  dirJoinQuestion: string;
  dirJoinDesc: string;
  dirJoinButton: string;
  dirLoadError: string;
  dirRegisterTitle: string;
  dirEditTitle: string;
  dirReviewNote: string;
  dirAlreadyRegisteredNote: string;
  dirFullName: string;
  dirFullNamePlaceholder: string;
  dirCity: string;
  dirCityPlaceholder: string;
  dirCountry: string;
  dirRole: string;
  dirBio: string;
  dirBioPlaceholder: string;
  dirContactSection: string;
  dirContactNote: string;
  dirWhatsapp: string;
  dirPhone: string;
  dirEmail: string;
  dirOtherContact: string;
  dirOtherContactPlaceholder: string;
  dirCelebrationSection: string;
  dirCelebrationNote: string;
  dirBirthday: string;
  dirAliyahDate: string;
  dirNameRequired: string;
  dirCityRequired: string;
  dirSubmit: string;
  dirSubmitting: string;
  dirUpdate: string;
  dirSubmitFailed: string;
  dirSuccessTitle: string;
  dirSuccessDesc: string;
  dirUpdateSuccessTitle: string;
  dirUpdateSuccessDesc: string;
  dirBackToDirectory: string;
  commLearningTitle: string;
  commLearningSoon: string;
  commSynagogueTitle: string;
  commLightCandle: string;
  commSeeAll: string;
  /* extra UI strings for community sub-screens */
  commAnnouncementsNoneTitle: string;
  commAnnouncementsNoneDesc: string;
  commAnnouncementsPinnedSection: string;
  commAnnouncementsRecentSection: string;
  commMemorialsInLovingMemory: string;
  commMemorialsAddFirst: string;
  commMemorialsLightTitle: string;
  commMemorialsLightDesc: string;
  commMemorialsSubmitBtn: string;
  commMemorialsAddedBanner: string;
  commMemorialsDedicateTitle: string;
  commMemorialsDedicateDesc: string;
  commMemorialsDedicateBtn: string;
  commPrayerNone: string;
  commPrayerNoneFirst: string;
  commPrayerSubmitTitle: string;
  commPrayerPendingNotice: string;
  commPrayerSubmittedNotice: string;
  commSynagogueDirectoryTitle: string;
  commSynagogueDirectoryDesc: string;
  commEventsComingSoonHint: string;
  commLearningComingSoonHint: string;
  commOrgShaveiDesc: string;
  commOrgFedDesc: string;
  commOrgShivteiName: string;
  commOrgShivteiTagline: string;
  commOrgShivteiDesc: string;
  /* events deep screen */
  commEventsSeeAll: string;
  commEventsEmpty: string;
  commEventsScreenTitle: string;
  commEventsToday: string;
  commEventsTomorrow: string;
  commEventsWeekly: string;
  commEventsMonthly: string;
  /* learning groups deep screen */
  commLearningSeeAll: string;
  commLearningScreenDesc: string;
  commLearningNewGroupTitle: string;
  commLearningNewGroupDesc: string;
  commLearningOpenToAll: string;
  commLearningWomenOnly: string;
  /* synagogue deep screen */
  commSynagogueSeeAll: string;
  commSynagogueScreenDesc: string;
  commSynagogueRegisterTitle: string;
  commSynagogueRegisterDesc: string;
  commSynagogueStatLocations: string;
  commSynagogueStatCountries: string;
  commSynagogueStatMembers: string;
  commSynagogueTypeBK: string;
  commSynagogueTypePG: string;
  commSynagogueTypeCC: string;
  /* synagogue registration form */
  commSynagogueFormTitle: string;
  commSynagogueFormSubtitle: string;
  commSynagogueFormName: string;
  commSynagogueFormNamePlaceholder: string;
  commSynagogueFormCity: string;
  commSynagogueFormCityPlaceholder: string;
  commSynagogueFormCountry: string;
  commSynagogueFormCountryPlaceholder: string;
  commSynagogueFormType: string;
  commSynagogueFormContact: string;
  commSynagogueFormContactPlaceholder: string;
  commSynagogueFormDescription: string;
  commSynagogueFormDescriptionPlaceholder: string;
  commSynagogueFormSubmit: string;
  commSynagogueFormCancel: string;
  commSynagogueFormDone: string;
  commSynagogueFormSuccess: string;
  commSynagogueFormSuccessDesc: string;
  commSynagogueFormError: string;
  commSynagogueFormRequired: string;
  commSynagogueFormEmailInvalid: string;
  /* shared action labels */
  commBack: string;
  commContact: string;
  commMap: string;
  commMembersCount: string;

  /* ── Translation Editor ── */
  txEditorTitle: string;
  txEditorSubtitle: string;
  txEditorSave: string;
  txEditorSaved: string;
  txEditorReset: string;
  txEditorResetConfirm: string;
  txEditorSearch: string;
  txEditorEnglish: string;
  txEditorThadou: string;
  txEditorGroupNav: string;
  txEditorGroupHome: string;
  txEditorGroupSettings: string;
  txEditorGroupFab: string;
  txEditorNote: string;

  /* ── Community timestamps ── */
  commJustNow: string;
  commMinAgo: string;
  commHourAgo: string;
  commDayAgo: string;

  /* ── Sacred Wisdom (SPR-M012) ── */
  sacredWisdomTitle: string;
  sacredWisdomTagline: string;
  sacredWisdomPlaceholder: string;
  sacredWisdomSuggestedTitle: string;
  sacredWisdomContinueTitle: string;
  sacredWisdomLibraryTitle: string;
  sacredWisdomQ1: string;
  sacredWisdomQ2: string;
  sacredWisdomQ3: string;
  sacredWisdomQ4: string;
  sacredWisdomQ5: string;
  sacredWisdomQ6: string;
  sacredWisdomQ7: string;
  sacredWisdomQ8: string;
  sacredWisdomTopicJudaism: string;
  sacredWisdomTopicHebrew: string;
  sacredWisdomTopicPrayer: string;
  sacredWisdomTopicTorah: string;
  sacredWisdomTopicBneiMenashe: string;
  sacredWisdomTopicCalendar: string;
  sacredWisdomTopicHistory: string;

  /* ── Settings alerts ── */
  settingsAlertOk: string;
  settingsAlertCancel: string;
  settingsAlertNotifBlockedTitle: string;
  settingsAlertNotifBlockedMsg: string;
  settingsAlertScheduledTitle: string;
  settingsAlertScheduledMsg: string;
  settingsAlertPermDeniedTitle: string;
  settingsAlertPermDeniedMsg: string;
  settingsAlertServerPushTitle: string;
  settingsAlertServerPushMsg: string;
  settingsAlertErrorTitle: string;
  settingsAlertServerPushErrMsg: string;
  settingsAlertTestSentTitle: string;
  settingsAlertTestSentMsg: string;
  settingsAlertTestFailMsg: string;
  settingsAlertSignOutTitle: string;
  settingsAlertSignOutMsg: string;

  /* ── Settings — UI strings (RC-003) ── */
  settingsThemeMidnight: string;
  settingsThemeParchment: string;
  settingsThemeSapphire: string;
  settingsNotifCandleLighting: string;
  settingsNotifHavdalah: string;
  settingsNotifParasha: string;
  settingsNotifHolidayAlerts: string;
  settingsNotifPrayerReminders: string;
  settingsNotifShabbatSub: string;
  settingsNotifHavdalahSub: string;
  settingsNotifParashaSub: string;
  settingsNotifHolidaySub: string;
  settingsNotifPrayersSub: string;
  settingsScheduled: string;
  settingsScheduledCount: string;
  settingsEnableAllNotif: string;
  settingsRescheduleNow: string;
  settingsRescheduling: string;
  settingsLocalNotifDesc: string;
  settingsServerPushSection: string;
  settingsServerPushLabel: string;
  settingsServerPushActiveDesc: string;
  settingsServerPushInactiveDesc: string;
  settingsSendingPush: string;
  settingsSendTestNotif: string;
  settingsServerPushFullDesc: string;
  settingsSignedIn: string;
  settingsSignOutHint: string;
  settingsSelectLocation: string;
  settingsLocationUtc: string;
  locationDetectGps: string;
  locationDetecting: string;
  locationGpsError: string;
  locationSearchPlaceholder: string;
  settingsYourAccount: string;
  settingsLeadTimeSection: string;
}

export const sharedEn: SharedTranslations = {
  navHome: "Home",
  navCalendar: "Calendar",
  navZmanim: "Zmanim",
  navCommunity: "Community",
  navTorah: "Torah",
  navSettings: "Settings",
  navJourney: "Journey",
  libraryBrowseCategories: "Browse by category",
  libraryTitle: "Library",
  libraryBooksAvailable: "books available",
  librarySearchPlaceholder: "Search books, authors, topics…",
  libraryVoiceSearch: "Voice search",
  libraryFilter: "Filter library",
  libraryBack: "Go back",
  libraryFilterTitle: "Show me",
  libraryFilterAll: "All books",
  libraryFilterFree: "Free books",
  libraryFilterPremium: "Premium books",
  libraryTotalBooks: "Total Books",
  libraryInLibrary: "In your library",
  libraryPremium: "Premium",
  libraryProContent: "Pro content",
  libraryFree: "Free",
  libraryAvailableToRead: "Available to read",
  libraryFreeBadge: "FREE",
  libraryProBadge: "PRO",
  libraryLocked: "Locked",
  libraryDownloaded: "Downloaded",
  libraryNew: "NEW",
  libraryRecent: "Recent",
  libraryOpen: "Open book",
  libraryLockedDescription: "This book is not available to open yet.",
  libraryNoBooksFound: "No books found",
  libraryNoBooksInCategory: "No books in this category",
  libraryTrySearch: "Try a different search term.",
  libraryCheckBack: "Check back soon — more books are being added.",
  libraryBookActions: "Book actions",
  libraryClose: "Close",
  libraryCategoryAll: "All",
  libraryCategorySiddur: "Siddur",
  libraryCategoryTehillim: "Tehillim",
  libraryCategoryTorahPortions: "Torah Portions",
  libraryCategoryDailyStudy: "Daily Study",
  libraryCategoryPrayerBooks: "Prayer Books",
  libraryCategoryHebrewLearning: "Hebrew Learning",
  libraryCategoryCommunity: "Community",
  libraryCategoryPremium: "Premium",

  journeyGreeting: "Shalom",
  journeySummaryTitle: "Your Journey",
  journeyStudyCard: "Study Journey",
  journeyMemorialCard: "Memorial Journey",
  journeyCommunityCard: "Community",
  journeyCalendarCard: "Calendar",
  journeyStartYourJourney: "Start Your Journey",
  journeyContinueTitle: "Continue",
  journeyContinueStudy: "Continue Study",
  journeyContinueCalendar: "Continue Calendar",
  journeyContinueMemorial: "Continue Memorial",
  journeyContinueAI: "Continue AI",
  journeyBookmarksTitle: "Bookmarks",
  journeyBookmarksEmpty: "No bookmarks yet",
  journeyBookmarksEmptySub: "Bookmark prayers, parshiyot, and sacred texts — find them here.",
  journeyReflectionTitle: "Today's Reflection",

  journeyCensusSectionTitle: "Community Census",
  journeyCensusMilestoneTitle: "Complete Community Census",
  journeyCensusMilestoneSubtitle: "Help strengthen the Bnei Menashe community by completing your family census.",
  journeyCensusStartCta: "Start Census",
  journeyCensusStatusTitle: "Census Record",
  journeyCensusFamiliesLabel: "Families",
  journeyCensusAliyahTitle: "Prepare for Aliyah",
  journeyCensusAliyahSubtitle: "Your family is registered and awaiting Aliyah.",
  journeyCensusUnavailable: "Census data unavailable",

  journeyTodaysLearning: "Today's Learning",
  journeyLearningGroupLabel: "LEARNING GROUP",
  journeyNextSession: "Next Session",
  journeyContinueLearning: "Continue Learning →",
  journeyNoLearningToday: "No study session scheduled today",
  journeyTodaysSacredTime: "Today's Sacred Time",
  journeyNextPrayer: "Next Prayer",
  journeyOpenZmanim: "Open Zmanim →",
  journeyNoZmanim: "Location not set",
  journeyCommunityToday: "Community Today",
  journeyNextEvent: "Upcoming Event",
  journeyPrayerRequests: "Prayer Requests",
  journeyLatestAnnouncement: "Announcement",
  journeyNoEvents: "No upcoming events",
  journeyOpenCommunity: "Open Community →",
  journeyFamilyJourney: "Family Journey",
  journeyMemorialReminder: "Community Memorials",
  journeyVisitSanctuary: "Visit Sanctuary →",
  journeyNoMemorials: "No memorials yet",
  journeyMemorialsLearning: "Active Dedications",
  journeyTodaysRecommendation: "Today's Recommendation",
  journeyAllPrayersDone: "All Prayers Complete",
  journeyAnonymous: "Anonymous",
  journeyNoPrayerRequests: "No requests yet",
  journeyNoAnnouncements: "No announcements yet",
  journeyMemorialSingular: "Memorial",
  journeyMemorialPlural: "Memorials",

  censusFamilyHeadTitle: "Family Head Registration",
  censusGoBack: "Go back",
  censusSaveDraft: "Save Draft",
  censusStep1of3: "Step 1 of 3 — Family Head",
  censusSectionIdentity: "Identity",
  censusSectionFamily: "Family Background",
  censusSectionAliyah: "Aliyah Status",
  censusSectionPassport: "Passport Details",
  censusFieldSurname: "Surname",
  censusFieldNamePassport: "Name (as per passport)",
  censusFieldHebrewName: "Hebrew Name",
  censusFieldSex: "Sex",
  censusFieldMaritalStatus: "Marital Status",
  censusFieldDob: "Date of Birth",
  censusFieldFatherName: "Father's Name",
  censusFieldMotherName: "Mother's Name",
  censusFieldJudaismDate: "Year of Judaism Practice",
  censusFieldAliyahStatus: "Aliyah Status",
  censusFieldPassportNo: "Passport Number",
  censusFieldPassportIssue: "Passport Issue Date",
  censusFieldPassportExpiry: "Passport Expiry Date",
  censusPrivacyNote: "Your data is held securely by community administrators and is never shared publicly without your consent.",
  censusSubmitCta: "Submit Registration",
  censusSubmitTitle: "Registration Submitted",
  censusSubmitBody: "Your family head record has been saved. You can add family members in the next step.",
  censusSaveDraftTitle: "Draft Saved",
  censusSaveDraftBody: "Your progress has been saved. You can return to complete this form at any time.",
  censusValidationTitle: "Required Field",
  censusNameRequired: "Please enter your full name as it appears on your passport.",
  censusErrorTitle: "Could Not Save",
  censusErrorBody: "Please check your connection and try again.",
  censusErrSurnameRequired: "Surname is required.",
  censusErrDobFormat: "Date of birth must be in YYYY-MM-DD format.",
  censusErrDobFuture: "Date of birth cannot be in the future.",
  censusErrYearFormat: "Enter a 4-digit year (e.g. 1995).",
  censusErrYearFuture: "Year cannot be in the future.",
  censusErrPassportDateFormat: "Passport date must be in YYYY-MM-DD format.",
  censusErrExpiryAfterIssue: "Expiry date must be after issue date.",
  censusDiscardDraft: "Discard Draft",
  censusDiscardDraftTitle: "Discard Draft?",
  censusDiscardDraftBody: "All progress will be lost. This cannot be undone.",
  censusDiscardDraftConfirm: "Discard",
  censusAliyahInIsrael: "In Israel",
  censusAliyahAwaiting: "Awaiting Aliyah",
  censusAliyahUnknown: "Unknown",
  censusSexMale: "Male",
  censusSexFemale: "Female",
  censusSelectPlaceholder: "Select…",
  censusMaritalSingle: "Single",
  censusMaritalMarried: "Married",
  censusMaritalDivorced: "Divorced",
  censusMaritalWidowed: "Widowed",
  censusSubmitScreenTitle: "Submit Community Census",
  censusStep4of4: "Step 4 of 4",
  censusAlmostDone: "ALMOST DONE",
  censusReadyToSubmit: "Ready to Submit",
  censusReadBeforeSubmit: "Please read the following before confirming your submission.",
  censusPeople: "People",
  censusMembers: "Members",
  censusBullet1: "Your information will be securely submitted to community administrators.",
  censusBullet2: "Administrators may review your submission before it is recorded.",
  censusBullet3: "If corrections are needed, you may be asked to resubmit.",
  censusBullet4: "Your data is never shared publicly or with third parties.",
  censusSubmissionFailed: "Submission Failed",
  censusSubmissionFailedMsg: "Submission failed. Please try again.",
  censusRetry: "Retry",
  censusBackToReview: "Back to Review",
  censusPrevious: "Previous",
  censusConfirmSubmit: "Confirm & Submit",

  navSiddur: "Siddur",

  homeToday: "TODAY",
  homeHebrewDate: "HEBREW DATE",
  homeGregorian: "GREGORIAN",
  homeHebrewYear: "Hebrew Year",
  homeSacredCalendar: "Sacred Calendar",
  homeZmanim: "ZMANIM",
  homeViewAll: "VIEW ALL »",
  homeSunrise: "Sunrise",
  homeSunset: "Sunset",
  homeNightfall: "Nightfall",
  homeCandleLighting: "Candle Lighting",
  homeHavdalah: "Havdalah",
  homeHavdalahAt: "Havdalah at",
  homeHavdalahTonight: "HAVDALAH TONIGHT",
  homeTodayShabbat: "Today's Shabbat",
  homeUpcomingShabbat: "Upcoming Shabbat",
  homeShabbatShalom: "Shabbat Shalom",
  homeShabbatInProgress: "Shabbat is in progress",
  homeShavuaTov: "Shavua Tov — a wonderful week!",
  homeUntilHavdalah: "Until Havdalah",
  homeUntilCandleLighting: "Until Candle Lighting",
  homeUntilNextShabbat: "Until Next Shabbat",
  homeQuickTools: "Quick Tools",
  homeKeyZmanim: "Key Zmanim Today",
  homeWeeklyParasha: "Weekly Parasha",
  homeParashah: "PARASHAH",
  homeUpcomingHoliday: "Upcoming Holiday",
  homeUpcomingHolidays: "UPCOMING HOLIDAYS",
  homeNoHolidays: "No upcoming holidays",
  homeNextPrayer: "Next Prayer",
  homeNoPrayer: "See full zmanim",
  homeTodayHoliday: "TODAY'S HOLIDAY",
  homeChagSameach: "Chag Sameach! 🎉",
  homeDafYomi: "Daf Yomi",
  homeDafYomiToday: "Today's Daf",
  homeOmer: "Omer Count",
  homeOmerWeeks: "weeks",
  homeOmerDays: "days",
  homeDailyTorah: "📖 DAILY TORAH THOUGHT",
  homeReadMore: "Read more ↓",
  homeShowLess: "Show less ↑",
  homeShare: "↑ Share",
  homeCommunityTitle: "Community",
  homeCommunityDesc: "Shavei Israel, Torah classes, connect with members",
  homeCensusTitle: "Census & Demographics",
  homeCensusDesc: "Fill out the community census form and view statistics",
  homeMoreTools: "More Tools",

  homeGoodMorning: "Good Morning",
  homeGoodAfternoon: "Good Afternoon",
  homeGoodEvening: "Good Evening",
  homePrayerTimesTitle: "Prayer Times",
  homeDawn: "Dawn",
  homeLatestShema: "Latest Shema",
  homeNoon: "Halachic Noon",
  homeMincha: "Mincha Ketana",
  homePlag: "Plag HaMincha",
  homeTzais: "Tzais HaKochavim",
  homeViewZmanim: "View All Zmanim",
  homeShabbatTitle: "Shabbat",
  homeMemorialTitle: "Memorial Sanctuary",
  homeMemorialDesc: "Honor and remember our ancestors in a sacred space",
  homeOpenSanctuary: "Open Sanctuary",
  homeAITitle: "Rav Menashe AI",
  homeAIDesc: "Ask any question about halacha, tradition, or the calendar",
  homeAskRavMenashe: "Ask Rav Menashe…",
  homeInsightTitle: "Daily Torah Insight",
  homeQuickActionsTitle: "Quick Actions",

  homeTodaysFocusLabel: "TODAY'S FOCUS",
  homeCandleLightingToday: "Candle Lighting Today",
  homePrepareForShabbat: "Prepare your heart for Shabbat",
  homeTodaysZmanimLabel: "TODAY'S ZMANIM",
  homeAllTimesLocal: "All Times Local",
  homeMinchaGedola: "Mincha Gedola",
  homeReadSummary: "Read Summary",
  homeOpenDafYomi: "Open Daf Yomi",
  homeViewAllHolidays: "View All Holidays",
  homeGoPremium: "Go Premium",
  homeSupportMission: "Support the mission. Unlock more.",
  homeViewBenefits: "View Benefits",
  premiumTitle: "Menashe Premium",
  premiumTagline: "Unlock the full depth of your sacred journey",
  premiumHeroSubtitle: "Sacred study, AI insights, audio guides, and more",
  premiumComingSoon: "Coming Soon",
  premiumComingSoonBody: "Premium membership is under active development. Payments are not yet available — we are working hard to bring this to you soon. Contact us to request early access.",
  premiumContactSupport: "Contact Support",
  premiumFreeLabel: "Free",
  premiumProLabel: "Premium",
  premiumCompareTitle: "Free vs Premium",
  premiumFeaturesTitle: "What's Included",
  premiumBack: "Back",
  premiumEarlyAccess: "Request Early Access",
  homeSanctuaryAction: "Sanctuary",
  homeStudyAction: "Study",
  homeMoreAction: "More",
  homeMemorialTagline: "A place of remembrance and eternal light.",
  homeAITagline: "Ask. Learn. Grow. Your AI companion.",
  homeUntilNextShabbatLabel: "UNTIL NEXT SHABBAT",

  homeSacredTimeLabel: "Sacred Time",
  homeNowLabel: "Now",
  homeLearningLabel: "Learning",
  homeCommunityPreviewTitle: "Community",
  homeCommunityPreviewDesc: "Connect with Bnei Menashe worldwide",
  homeCommunityPreviewCta: "View Community",
  homeEnterSanctuary: "Enter Sanctuary",

  homeThisWeekLabel: "This Week",
  homeCalendarLink: "Calendar",
  homeGlanceLabel: "Today at a Glance",
  homeFullZmanimLink: "Full Zmanim",
  homeReadLink: "Read",

  settingsTitle: "Settings",
  settingsAppearance: "APPEARANCE",
  settingsTheme: "Theme",
  settingsDarkMode: "Dark Mode",
  settingsDarkOn: "Dark mode active",
  settingsDarkOff: "Light mode active",
  settingsShowHebrew: "Show Hebrew Dates",
  settingsLanguage: "Thadou Kuki Language",
  settingsLanguageHint: "Show labels in Thadou Kuki",
  settingsEditTranslations: "✏️ Edit Thadou Kuki Labels",
  settingsEditTranslationsHint: "Fix or improve any translation",
  settingsLocation: "LOCATION",
  settingsCity: "City",
  settingsCityHint: "Used for Zmanim calculations",
  settingsTimezone: "Timezone",
  settingsNotifications: "NOTIFICATIONS",
  settingsCandleLighting: "🕯 Candle Lighting",
  settingsHavdalah: "✨ Havdalah",
  settingsShema: "📖 Latest Shema",
  settingsPrayers: "🕍 Prayer Reminders",
  settingsHoliday: "✡ Holiday Alerts",
  settingsHolidays: "✡ Holiday Alerts",
  settingsParasha: "📜 Weekly Parasha",
  settingsOmer: "🌾 Omer Counting",
  settingsShabbatDigest: "📋 Shabbat Digest",
  settingsYahrtzeit: "🕯 Yahrtzeit Reminders",
  settingsLeadTime: "Reminder Lead Time",
  settingsLeadTimeHint: "How many minutes before each Zman to alert",
  settingsBgPush: "BACKGROUND PUSH",
  settingsBgPushDesc: "Receive notifications even when the app is closed. Your notification preferences will be sent in the background.",
  settingsBgPushDescUnsupported: "Background push notifications are not supported on this device.",
  settingsEnablePush: "🔔 Enable Background Push",
  settingsEnablingPush: "Enabling…",
  settingsTestPush: "🧪 Send Test Push",
  settingsTestSent: "✓ Test Sent!",
  settingsDisablePush: "Disable",
  settingsPushActive: "Active — notifications scheduled for",
  settingsTools: "TOOLS",
  settingsTahara: "Tahara Calculator",
  settingsTaharaSub: "Mikveh & purity timing",
  settingsYartzeitCalc: "Yahrzeit Calculator",
  settingsYartzeitSub: "Anniversary of passing",
  settingsBirthday: "Hebrew Birthday",
  settingsBirthdaySub: "Your Jewish birthday",
  settingsCommunity: "Community",
  settingsCommunitySub: "Bnei Menashe worldwide",
  settingsCensus: "Census & Demographics",
  settingsCensusSub: "Community statistics",
  settingsUpgrade: "Upgrade to Premium",
  settingsUpgradeSub: "Unlock all features — 7 days free",
  settingsAccount: "ACCOUNT",
  settingsEditProfile: "Edit Profile",
  settingsEditProfileHint: "Update your public community profile",
  settingsSignOut: "Sign Out",
  /* ── Edit Profile screen ── */
  profileTitle: "My Profile",
  profileVisibleIn: "Visible in Member Directory & Prayer Board",
  profileDisplayName: "Display Name",
  profileCongregation: "Congregation / Community",
  profileRole: "Role",
  profileCountry: "Country",
  profileCity: "City",
  profileBio: "Bio",
  profileBioPlaceholder: "A short description about yourself (optional)",
  profileUploadPhoto: "Upload Photo",
  profileChangePhoto: "Change Photo",
  profileRemovePhoto: "Remove Photo",
  profilePhotoHint: "Max 5 MB · JPEG or PNG",
  profilePhotoTooBig: "Photo exceeds the 5 MB limit. Please choose a smaller image.",
  profileChooseEmoji: "Choose Avatar Emoji",
  profileNameRequired: "Please enter your display name.",
  profileSaveBtn: "Save Profile",
  profileSaving: "Saving…",
  profileSaved: "✓ Saved!",
  profileVisibility: "Your profile is visible to other community members.",
  settingsVersion: "Menashe Calendar",
  settingsNotifBlocked: "Notifications blocked",
  settingsNotifBlockedSub: "Enable notifications for this app in your device settings",
  settingsNotifUnsupported: "Not supported on this device",
  settingsNotifActive: "Active",

  fabTitle: "Community Hub",
  fabAnnouncements: "Announcements",
  fabCommunityEvents: "Community Events",
  fabCommunityMemorial: "Community Memorial",
  fabTorahWisdom: "48 Ways to Torah Wisdom",
  fabPrayerBoard: "Prayer Board",
  fabTorahTracker: "Torah Tracker",

  sacredStudyBeginJourney: "Begin Your Journey",
  sacredStudyStudyPaths: "Study Paths",
  sacredStudyJewishCalendar: "Jewish Calendar",
  sacredStudyBookmarks: "Bookmarks",
  sacredStudyRecentlySaved: "Recently Saved",
  sacredStudyNoBookmarks: "Nothing saved yet. Continue any study to save your place here.",
  sacredStudyLearningJourney: "Learning Journey",
  sacredStudyStudyDays: "Study Days",
  sacredStudyLessonsCompleted: "Lessons Completed",
  sacredStudyThisWeek: "This Week's Reading",

  sacredMemoryTitle: "Sacred Memory",
  sacredMemorySubtitle: "Remember with light. Honor with love.",
  sacredMemoryTodaysRemembrance: "Today's Remembrance",
  sacredMemoryNoRemembrance: "No remembrance scheduled today.",
  sacredMemoryMyFamilyMemorials: "My Family Memorials",
  sacredMemoryNoFamilyMemorials: "Memorials you light will appear here.",
  sacredMemoryLightCandle: "Light a Candle",
  sacredMemoryLightCandleDesc: "Honor a loved one's memory with a single tap.",
  sacredMemoryLightCandleCta: "Light Candle",
  sacredMemoryRecentCandles: "Recent Candles",
  sacredMemoryNoRecentCandles: "No candles lit yet. Be the first to light one.",
  sacredMemoryPrayerReflection: "Prayer & Reflection",
  sacredMemoryCommunityMemorial: "Community Memorial",
  sacredMemoryViewCommunity: "View Community Memorial",
  sacredMemoryCandlesLit: "Candles Lit",
  sacredMemoryLearningNow: "Learning Now",
  sacredMemoryEnterSanctuary: "Enter Sanctuary",
  sacredMemoryEnterSanctuaryCta: "Enter 3D Sanctuary",
  sacredMemoryEnterSanctuaryDesc: "Step gently into the immersive memorial garden — a sacred space to walk among the lights of those remembered.",
  sacredMemoryEntryLabel: "Sacred Memory",
  sacredMemoryEntrySub: "Remember & reflect",

  commHubTitle: "Community",
  commHubSubtitle: "Your Bnei Menashe community hub",
  commStatPopulation: "TOTAL POPULATION",
  commStatAliyah: "MADE ALIYAH",
  commStatParshiyot: "PARSHIYOT",
  commIsaiahQuote: "I will bring the remnant of my people from the East, and gather them from the West.",
  commIsaiahRef: "Isaiah 43:5",
  commEnterSanctuary: "Enter Sanctuary",
  commAnnouncementsTitle: "Announcements",
  commAnnouncementsSeeAll: "See all",
  commAnnouncementsPinned: "Pinned",
  commAnnouncementsEmpty: "No announcements yet",
  commPrayerTitle: "Prayer Requests",
  commPrayerSeeAll: "See all",
  commPrayerAmen: "Amen",
  commPrayerEmpty: "No prayer requests yet",
  commPrayerSubmit: "Add a Request",
  commMemorialsTitle: "Community Memorials",
  commMemorialsSeeAll: "See all",
  commMemorialsEmpty: "No memorials yet",
  commMemorialsCandlesLit: "Candles Lit",
  commMemorialsLearning: "Learning Now",
  commEventsTitle: "Upcoming Events",
  commEventsSoon: "Events calendar coming soon",
  commOrgsTitle: "Organizations",
  commOrgsSeeAll: "See all",
  commOrgsScreenDesc: "Organizations and resources supporting the Bnei Menashe community worldwide.",
  commOrgsStatOrgs: "Organizations",
  commOrgVisitSite: "Visit Site",
  commOrgHotlineDesc: "For halachic and community questions.",
  commOrgNewsletterDesc: "Monthly community updates.",
  commOrgTorahClassesDesc: "Online shiurim for Bnei Menashe communities.",
  dirTitle: "Member Directory",
  dirSeeAll: "See all",
  dirHubCardDesc: "Find and connect with Bnei Menashe members worldwide.",
  dirMembersWorldwide: "approved members worldwide",
  dirSearchPlaceholder: "Search by name or city…",
  dirNoMembers: "No approved members yet",
  dirNoMatch: "No members match your search",
  dirBeFirst: "Be the first to register!",
  dirConnect: "Connect",
  dirClose: "Close",
  dirMemberSince: "Member since",
  dirJoinQuestion: "Are you a Bnei Menashe member?",
  dirJoinDesc: "Add yourself to the community directory",
  dirJoinButton: "Join the Directory",
  dirLoadError: "Couldn't load the directory. Please try again.",
  dirRegisterTitle: "Join the Directory",
  dirEditTitle: "Edit My Listing",
  dirReviewNote: "Your profile will be reviewed by the admin before appearing in the directory.",
  dirAlreadyRegisteredNote: "You're already listed in the directory. Changes are saved right away.",
  dirFullName: "Full Name",
  dirFullNamePlaceholder: "Your full name",
  dirCity: "City",
  dirCityPlaceholder: "Your city",
  dirCountry: "Country",
  dirRole: "Role in Community",
  dirBio: "Short Bio (optional)",
  dirBioPlaceholder: "A few words about yourself and your connection to the community…",
  dirContactSection: "Contact Info (optional)",
  dirContactNote: "Only visible to other approved members. Leave blank if you prefer privacy.",
  dirWhatsapp: "WhatsApp Number",
  dirPhone: "Phone Number",
  dirEmail: "Email Address",
  dirOtherContact: "Other (Telegram, Facebook, etc.)",
  dirOtherContactPlaceholder: "e.g. @username on Telegram",
  dirCelebrationSection: "Celebration Dates (optional)",
  dirCelebrationNote: "Let the community wish you on your special days! Only approved members are notified.",
  dirBirthday: "Birthday",
  dirAliyahDate: "Aliyah Date",
  dirNameRequired: "Please enter your name.",
  dirCityRequired: "Please enter your city.",
  dirSubmit: "Submit for Review",
  dirSubmitting: "Submitting…",
  dirUpdate: "Save Changes",
  dirSubmitFailed: "Failed to submit — please try again.",
  dirSuccessTitle: "Registration Submitted!",
  dirSuccessDesc: "Your profile is now pending review. The admin will approve your listing shortly.",
  dirUpdateSuccessTitle: "Changes Saved!",
  dirUpdateSuccessDesc: "Your directory listing has been updated.",
  dirBackToDirectory: "Back to Directory",
  commOrgConnectDesc: "Find community members near you.",
  commLearningTitle: "Learning Groups",
  commLearningSoon: "Learning groups coming soon",
  commSynagogueTitle: "Synagogue",
  commLightCandle: "Light a Candle",
  commSeeAll: "See all",
  commAnnouncementsNoneTitle: "No Announcements",
  commAnnouncementsNoneDesc: "Community announcements will appear here when they are sent.",
  commAnnouncementsPinnedSection: "PINNED",
  commAnnouncementsRecentSection: "RECENT",
  commMemorialsInLovingMemory: "In loving memory",
  commMemorialsAddFirst: "Be the first to light a memorial candle for a loved one.",
  commMemorialsLightTitle: "Light a Candle",
  commMemorialsLightDesc: "Light a virtual yahrzeit candle to honour a loved one in the community.",
  commMemorialsSubmitBtn: "Light the Candle",
  commMemorialsAddedBanner: "Candle lit — your memorial has been added",
  commMemorialsDedicateTitle: "Dedicate Learning",
  commMemorialsDedicateDesc: "Dedicate your Torah learning in honour of",
  commMemorialsDedicateBtn: "Dedicate My Learning",
  commPrayerNone: "No requests yet",
  commPrayerNoneFirst: "Be the first to share a prayer request.",
  commPrayerSubmitTitle: "New Prayer Request",
  commPrayerPendingNotice: "Requests are reviewed before appearing publicly.",
  commPrayerSubmittedNotice: "Your request has been submitted — it will appear after review.",
  commSynagogueDirectoryTitle: "Synagogue Directory",
  commSynagogueDirectoryDesc: "A directory of Bnei Menashe synagogues and prayer houses is being compiled. Contact your community admin to register.",
  commEventsComingSoonHint: "Check Announcements for the latest community events and gatherings.",
  commLearningComingSoonHint: "Explore Torah study in the Torah tab, or share a request on the Prayer Board.",
  commOrgShaveiDesc: "Connecting and supporting Bnei Menashe worldwide, facilitating aliyah to Israel.",
  commOrgFedDesc: "Community coordination — events, education, cultural preservation, and family support.",
  commOrgShivteiName: "Shivtei Menashe",
  commOrgShivteiTagline: "Reconnecting the tribe of Menashe",
  commOrgShivteiDesc: "A nonprofit strengthening Bnei Menashe in Israel and worldwide — spiritually, culturally, and historically.",
  commEventsSeeAll: "See all events",
  commEventsEmpty: "No upcoming events found. Check back soon.",
  commEventsScreenTitle: "Upcoming Events",
  commEventsToday: "Today",
  commEventsTomorrow: "Tomorrow",
  commEventsWeekly: "Weekly",
  commEventsMonthly: "Monthly",
  commLearningSeeAll: "See all groups",
  commLearningScreenDesc: "Structured Torah study for the Bnei Menashe community — all levels, all ages.",
  commLearningNewGroupTitle: "Start a Learning Group",
  commLearningNewGroupDesc: "Want to lead a study circle in your city? Contact us to get listed here.",
  commLearningOpenToAll: "Open to all",
  commLearningWomenOnly: "Women only",
  commSynagogueSeeAll: "View directory",
  commSynagogueScreenDesc: "Bnei Menashe prayer houses and community centers around the world.",
  commSynagogueRegisterTitle: "Register Your Synagogue",
  commSynagogueRegisterDesc: "Submit your details and we'll add your location to the directory.",
  commSynagogueStatLocations: "LOCATIONS",
  commSynagogueStatCountries: "COUNTRIES",
  commSynagogueStatMembers: "MEMBERS",
  commSynagogueTypeBK: "Beit Knesset",
  commSynagogueTypePG: "Prayer Group",
  commSynagogueTypeCC: "Community Center",
  commSynagogueFormTitle: "Register Your Synagogue",
  commSynagogueFormSubtitle: "Submit your details below and we'll review and add your location to the directory.",
  commSynagogueFormName: "Synagogue Name",
  commSynagogueFormNamePlaceholder: "e.g. Beit Knesset Bnei Menashe",
  commSynagogueFormCity: "City",
  commSynagogueFormCityPlaceholder: "e.g. Churachandpur",
  commSynagogueFormCountry: "Country",
  commSynagogueFormCountryPlaceholder: "e.g. India",
  commSynagogueFormType: "Type",
  commSynagogueFormContact: "Contact Email",
  commSynagogueFormContactPlaceholder: "e.g. rabbi@synagogue.org",
  commSynagogueFormDescription: "Description",
  commSynagogueFormDescriptionPlaceholder: "Brief description of services, community, and activities…",
  commSynagogueFormSubmit: "Submit Request",
  commSynagogueFormCancel: "Cancel",
  commSynagogueFormDone: "Done",
  commSynagogueFormSuccess: "Request Submitted!",
  commSynagogueFormSuccessDesc: "Thank you. Our team will review your submission and add your synagogue to the directory soon.",
  commSynagogueFormError: "Submission failed. Please try again.",
  commSynagogueFormRequired: "Name, city, and country are required.",
  commSynagogueFormEmailInvalid: "Please enter a valid email address.",
  commBack: "Back",
  commContact: "Contact",
  commMap: "Map",
  commMembersCount: "members",

  txEditorTitle: "Edit Thadou Kuki Labels",
  txEditorSubtitle: "Correct any translation below. Changes are saved on your device.",
  txEditorSave: "Save Changes",
  txEditorSaved: "✓ Saved!",
  txEditorReset: "Reset to Default",
  txEditorResetConfirm: "Reset all Thadou Kuki labels to the built-in defaults?",
  txEditorSearch: "Search labels…",
  txEditorEnglish: "English",
  txEditorThadou: "Thadou Kuki",
  txEditorGroupNav: "Navigation",
  txEditorGroupHome: "Home Page",
  txEditorGroupSettings: "Settings",
  txEditorGroupFab: "Community Hub",
  txEditorNote: "Tip: Switch to Thadou Kuki mode (Settings → Language) to see your changes live.",

  commJustNow: "just now",
  commMinAgo: "{n}m ago",
  commHourAgo: "{n}h ago",
  commDayAgo: "{n}d ago",

  sacredWisdomTitle: "Sacred Wisdom",
  sacredWisdomTagline: "Learn. Ask. Discover.",
  sacredWisdomPlaceholder: "Ask Rav Menashe anything…",
  sacredWisdomSuggestedTitle: "Suggested Questions",
  sacredWisdomContinueTitle: "Continue Learning",
  sacredWisdomLibraryTitle: "Learning Library",
  sacredWisdomQ1: "What is today's Parashah?",
  sacredWisdomQ2: "Explain today's Daf Yomi",
  sacredWisdomQ3: "When is candle lighting this Shabbat?",
  sacredWisdomQ4: "What is the meaning of the Shema?",
  sacredWisdomQ5: "Tell me about the Bnei Menashe journey",
  sacredWisdomQ6: "What is Havdalah and how is it observed?",
  sacredWisdomQ7: "Explain the significance of Shabbat",
  sacredWisdomQ8: "Who are the Bnei Menashe?",
  sacredWisdomTopicJudaism: "Judaism",
  sacredWisdomTopicHebrew: "Hebrew",
  sacredWisdomTopicPrayer: "Prayer",
  sacredWisdomTopicTorah: "Torah",
  sacredWisdomTopicBneiMenashe: "Bnei Menashe",
  sacredWisdomTopicCalendar: "Calendar",
  sacredWisdomTopicHistory: "History",

  settingsAlertOk: "OK",
  settingsAlertCancel: "Cancel",
  settingsAlertNotifBlockedTitle: "Notifications Blocked",
  settingsAlertNotifBlockedMsg: "Please enable notifications for Menashe Calendar in your device settings to receive alerts.",
  settingsAlertScheduledTitle: "Done",
  settingsAlertScheduledMsg: "{n} notifications scheduled on your device.",
  settingsAlertPermDeniedTitle: "Permission Denied",
  settingsAlertPermDeniedMsg: "Could not enable notifications. Check your device settings.",
  settingsAlertServerPushTitle: "Server Push Enabled",
  settingsAlertServerPushMsg: "You'll receive Shabbat and holiday reminders from the server even when the app is closed.",
  settingsAlertErrorTitle: "Error",
  settingsAlertServerPushErrMsg: "Failed to update server push settings.",
  settingsAlertTestSentTitle: "Test Sent",
  settingsAlertTestSentMsg: "A test push notification was sent from the server. It should arrive shortly.",
  settingsAlertTestFailMsg: "Failed to send test push.",
  settingsAlertSignOutTitle: "Sign Out",
  settingsAlertSignOutMsg: "Are you sure you want to sign out?",

  settingsThemeMidnight: "Midnight",
  settingsThemeParchment: "Parchment",
  settingsThemeSapphire: "Sapphire",
  settingsNotifCandleLighting: "Candle Lighting",
  settingsNotifHavdalah: "Havdalah",
  settingsNotifParasha: "Weekly Parasha",
  settingsNotifHolidayAlerts: "Holiday Alerts",
  settingsNotifPrayerReminders: "Prayer Reminders",
  settingsNotifShabbatSub: "18 min before Shabbat",
  settingsNotifHavdalahSub: "When Shabbat ends",
  settingsNotifParashaSub: "Friday morning reminder",
  settingsNotifHolidaySub: "Day before each holiday",
  settingsNotifPrayersSub: "Shacharit, Mincha, Maariv",
  settingsScheduled: "SCHEDULED",
  settingsScheduledCount: "{n} notifications scheduled",
  settingsEnableAllNotif: "Enable All Notifications",
  settingsRescheduleNow: "Reschedule Now",
  settingsRescheduling: "Rescheduling...",
  settingsLocalNotifDesc: "Notifications appear in your device's notification bar even when the app is closed. They are scheduled locally on your device — no internet required.",
  settingsServerPushSection: "SERVER PUSH NOTIFICATIONS",
  settingsServerPushLabel: "Server Push",
  settingsServerPushActiveDesc: "Shabbat & holiday alerts delivered by server",
  settingsServerPushInactiveDesc: "Enable to receive server-sent reminders",
  settingsSendingPush: "Sending...",
  settingsSendTestNotif: "Send Test Notification",
  settingsServerPushFullDesc: "Server push delivers Shabbat candle lighting, Havdalah, Parasha, and holiday reminders directly from the Bnei Menashe servers — even if you haven't opened the app in days.",
  settingsSignedIn: "Signed in",
  settingsSignOutHint: "You will be returned to the sign-in screen.",
  settingsSelectLocation: "Select Location",
  settingsLocationUtc: "UTC offset by timezone",
  locationDetectGps: "Use My Location",
  locationDetecting: "Detecting…",
  locationGpsError: "Could not detect location. Pick a city below.",
  locationSearchPlaceholder: "Search cities…",
  settingsYourAccount: "Your account",
  settingsLeadTimeSection: "LEAD TIME (PRAYERS)",
};

export const sharedTk: SharedTranslations = {
  navHome: "Inn",
  navCalendar: "Ni Thu",
  navZmanim: "Zmanim",
  navCommunity: "Mipil",
  navTorah: "Torah",
  navSettings: "Siam Dan",
  navJourney: "Zuangthu",
  libraryBrowseCategories: "Thlang dan tawh",
  libraryTitle: "Library",
  libraryBooksAvailable: "bu a om",
  librarySearchPlaceholder: "Bu, thu leh thupi zawng…",
  libraryVoiceSearch: "Thawng thawm hmanga zawng",
  libraryFilter: "Library thlang dan",
  libraryBack: "Kir leh",
  libraryFilterTitle: "Hengte chauh en",
  libraryFilterAll: "Bu zawng zawng",
  libraryFilterFree: "A man lo bu",
  libraryFilterPremium: "Premium bu",
  libraryTotalBooks: "Bu Zawng Zawng",
  libraryInLibrary: "Na library-ah",
  libraryPremium: "Premium",
  libraryProContent: "Pro thu",
  libraryFree: "Man lo",
  libraryAvailableToRead: "En dingin a om",
  libraryFreeBadge: "MAN LO",
  libraryProBadge: "PRO",
  libraryLocked: "Khawng",
  libraryDownloaded: "Download zawh",
  libraryNew: "THAR",
  libraryRecent: "Changkhat",
  libraryOpen: "Bu hawn",
  libraryLockedDescription: "He bu hi tunah hawn theih a la ni lo.",
  libraryNoBooksFound: "Bu hmuh a awm lo",
  libraryNoBooksInCategory: "He thlang dan-ah bu a awm lo",
  libraryTrySearch: "Thu dang zawng in.",
  libraryCheckBack: "Hun reuh ah en leh rawh — bu dangte belh zel ding.",
  libraryBookActions: "Bu thiltihte",
  libraryClose: "Khawng",
  libraryCategoryAll: "Zawng zawng",
  libraryCategorySiddur: "Siddur",
  libraryCategoryTehillim: "Tehillim",
  libraryCategoryTorahPortions: "Torah sunthal",
  libraryCategoryDailyStudy: "Ni tin zirna",
  libraryCategoryPrayerBooks: "Thumna bu",
  libraryCategoryHebrewLearning: "Hebrew zirna",
  libraryCategoryCommunity: "Mipil",
  libraryCategoryPremium: "Premium",

  journeyGreeting: "Shalom",
  journeySummaryTitle: "Na Zuangthu",
  journeyStudyCard: "Zir Zuangthu",
  journeyMemorialCard: "Hriatna Zuangthu",
  journeyCommunityCard: "Mipil",
  journeyCalendarCard: "Ni Thu",
  journeyStartYourJourney: "Na Zuangthu Tan",
  journeyContinueTitle: "Zai Zel",
  journeyContinueStudy: "Zir Zel",
  journeyContinueCalendar: "Ni Thu En Zel",
  journeyContinueMemorial: "Hriatna Zel",
  journeyContinueAI: "AI Zel",
  journeyBookmarksTitle: "Bookmark",
  journeyBookmarksEmpty: "Bookmark awm lo",
  journeyBookmarksEmptySub: "Thu dawt, parshiyot, leh thu thianghlim bookmark siam la, khi hian i hmu ang.",
  journeyReflectionTitle: "Tun Ni Ngaihtuah",

  journeyCensusSectionTitle: "Mipil Census",
  journeyCensusMilestoneTitle: "Mipil Census Zawh Zel",
  journeyCensusMilestoneSubtitle: "Bnei Menashe mipil khawngaih turin in tanan census zawh pek rawh.",
  journeyCensusStartCta: "Census Tan",
  journeyCensusStatusTitle: "Census Thu",
  journeyCensusFamiliesLabel: "Inpui",
  journeyCensusAliyahTitle: "Aliyah Tana Beisei",
  journeyCensusAliyahSubtitle: "In inpui a record ah a awm tawh, Aliyah duhna i nei.",
  journeyCensusUnavailable: "Census thu siamna awm lo",

  journeyTodaysLearning: "Tun Ni Zir",
  journeyLearningGroupLabel: "ZIR KIHILNA",
  journeyNextSession: "Thleng Kim",
  journeyContinueLearning: "Zir Zel →",
  journeyNoLearningToday: "Tun ni zirna awm lo",
  journeyTodaysSacredTime: "Tun Ni Thu Thianghlim",
  journeyNextPrayer: "Thu Dawt Kim",
  journeyOpenZmanim: "Zmanim En →",
  journeyNoZmanim: "Hmun siamsak lo",
  journeyCommunityToday: "Mipil Tun Ni",
  journeyNextEvent: "Lawmman Kim",
  journeyPrayerRequests: "Thu Dawt Duhna",
  journeyLatestAnnouncement: "Thuchhuah",
  journeyNoEvents: "Lawmman awm lo",
  journeyOpenCommunity: "Mipil En →",
  journeyFamilyJourney: "Inpui Zuangthu",
  journeyMemorialReminder: "Mipil Hriatna",
  journeyVisitSanctuary: "Sanctuary En →",
  journeyNoMemorials: "Hriatna awm lo",
  journeyMemorialsLearning: "Zirna Pet",
  journeyTodaysRecommendation: "Tun Ni Pawimawh",
  journeyAllPrayersDone: "Thu Dawt Zawng Zawh",
  journeyAnonymous: "Hming Lo",
  journeyNoPrayerRequests: "Duhna awm lo",
  journeyNoAnnouncements: "Thuchhuah awm lo",
  journeyMemorialSingular: "Hriatna",
  journeyMemorialPlural: "Hriatna",

  censusFamilyHeadTitle: "Inpui Bawipa Ziak",
  censusGoBack: "Zin chhuak",
  censusSaveDraft: "Draft Siamthei",
  censusStep1of3: "Step 1/3 — Inpui Bawipa",
  censusSectionIdentity: "Hming leh Thu",
  censusSectionFamily: "Inpui Mahni Thu",
  censusSectionAliyah: "Aliyah Thu",
  censusSectionPassport: "Passport Thu",
  censusFieldSurname: "Mei hming",
  censusFieldNamePassport: "Hming (Passport ang ziakin)",
  censusFieldHebrewName: "Hebrew Hming",
  censusFieldSex: "Naupang dik",
  censusFieldMaritalStatus: "Innei Thu",
  censusFieldDob: "Nisuah Ni",
  censusFieldFatherName: "Paa Hming",
  censusFieldMotherName: "Pi Hming",
  censusFieldJudaismDate: "Judaism Tan Kum",
  censusFieldAliyahStatus: "Aliyah Thu",
  censusFieldPassportNo: "Passport Nambiar",
  censusFieldPassportIssue: "Passport Chhuahna Ni",
  censusFieldPassportExpiry: "Passport Tawpna Ni",
  censusPrivacyNote: "I data hi mipil admin-te in phat takin an giamkhawm a, i duhna lo chuan an hrilh lo.",
  censusSubmitCta: "Ziak Pek",
  censusSubmitTitle: "Ziak Hmasa Zawh",
  censusSubmitBody: "In bawipa record siamsak tawh. Step hmasa chhunga member dang thiam.",
  censusSaveDraftTitle: "Draft Siamsak",
  censusSaveDraftBody: "I ziakna siamsak tawh. Hnuah zawh zel theih.",
  censusValidationTitle: "Dah Ngai Field",
  censusNameRequired: "Hming passport ang ziakin dah rawh.",
  censusErrorTitle: "Siamsak Theilo",
  censusErrorBody: "Internet connect khawia, tih leh rawh.",
  censusErrSurnameRequired: "Pau hming dah ngai.",
  censusErrDobFormat: "Nilaite YYYY-MM-DD format in dah rawh.",
  censusErrDobFuture: "Nite lak hnuah nilaite dah theilo.",
  censusErrYearFormat: "Kum 4 dik in dah rawh (e.g. 1995).",
  censusErrYearFuture: "Kum lak hnuah dah theilo.",
  censusErrPassportDateFormat: "Passport nilaite YYYY-MM-DD format in dah rawh.",
  censusErrExpiryAfterIssue: "Tawppui nite issue nite hnuah ni ngai.",
  censusDiscardDraft: "Draft Hon Phal",
  censusDiscardDraftTitle: "Draft Hon Phal Maw?",
  censusDiscardDraftBody: "Ziakna zawng zawng chhuah dawn. Tih leh theilo.",
  censusDiscardDraftConfirm: "Hon Phal",
  censusAliyahInIsrael: "Israel Chhunga",
  censusAliyahAwaiting: "Aliyah Ngai Mek",
  censusAliyahUnknown: "Hriat Lo",
  censusSexMale: "Patal",
  censusSexFemale: "Nu",
  censusSelectPlaceholder: "Dah Rawh…",
  censusMaritalSingle: "Neilo",
  censusMaritalMarried: "Innei Tawh",
  censusMaritalDivorced: "Inruk Tawh",
  censusMaritalWidowed: "Pho Thi Tawh",
  censusSubmitScreenTitle: "Inpui Census Pek",
  censusStep4of4: "Step 4/4",
  censusAlmostDone: "ZO HAI DAWN",
  censusReadyToSubmit: "Pek Theih Tawh",
  censusReadBeforeSubmit: "I pek hmain hi ziak zawng zawk rawh.",
  censusPeople: "Mipui",
  censusMembers: "Member",
  censusBullet1: "I thu hi phat takin admin-te hnenah pek dawn.",
  censusBullet2: "Admin-te chuan i pek thu en hnu chuan record an tih ang.",
  censusBullet3: "Thil dik lo awm chuan, tih leh pek turin ngen an tih thei.",
  censusBullet4: "I data hi pawl dangah an hrilh lo.",
  censusSubmissionFailed: "Pek Theilo",
  censusSubmissionFailedMsg: "Pek theilo. Tih leh rawh.",
  censusRetry: "Tih Leh",
  censusBackToReview: "En Leh",
  censusPrevious: "Hmasa",
  censusConfirmSubmit: "Ngaihdan Pek",

  navSiddur: "Thu Ziak",

  homeToday: "NIZAN",
  homeHebrewDate: "HEBREW NI",
  homeGregorian: "GREGORIAN",
  homeHebrewYear: "Hebrew Kum",
  homeSacredCalendar: "Ni Thu Thianghlim",
  homeZmanim: "ZMANIM",
  homeViewAll: "ZAWNG EN »",
  homeSunrise: "Ni Chhuak",
  homeSunset: "Ni Tlai",
  homeNightfall: "Zan",
  homeCandleLighting: "Katni Mei",
  homeHavdalah: "Havdalah",
  homeHavdalahAt: "Havdalah ni a",
  homeHavdalahTonight: "ZAN HAVDALAH",
  homeTodayShabbat: "Nizan Shabbat",
  homeUpcomingShabbat: "Shabbat Hla",
  homeShabbatShalom: "Shabbat Shalom",
  homeShabbatInProgress: "Shabbat a lo mek",
  homeShavuaTov: "Shavua Tov — Zarhnawk thar!",
  homeUntilHavdalah: "Havdalah Hmaa",
  homeUntilCandleLighting: "Katni Mei Hmaa",
  homeUntilNextShabbat: "Shabbat Thar Hmaa",
  homeQuickTools: "Thil Tihdan",
  homeKeyZmanim: "Nizan Zmanim",
  homeWeeklyParasha: "Parashah Thupek",
  homeParashah: "PARASHAH",
  homeUpcomingHoliday: "Ni Thianghlim Hla",
  homeUpcomingHolidays: "NI THIANGHLIM HLA",
  homeNoHolidays: "Ni thianghlim hla awm lo",
  homeNextPrayer: "Thu Dawt Hla",
  homeNoPrayer: "Zmanim En",
  homeTodayHoliday: "NIZAN NI THIANGHLIM",
  homeChagSameach: "Chag Sameach! 🎉",
  homeDafYomi: "Daf Yomi",
  homeDafYomiToday: "Nizan Daf",
  homeOmer: "Omer Chhiar",
  homeOmerWeeks: "thla",
  homeOmerDays: "ni",
  homeDailyTorah: "📖 NIZAN TORAH THU",
  homeReadMore: "Ziak zawk ↓",
  homeShowLess: "Zawk lo ↑",
  homeShare: "↑ Sawi Chhuak",
  homeCommunityTitle: "Mipil",
  homeCommunityDesc: "Shavei Israel, Torah class, member te nen in inhmuh",
  homeCensusTitle: "Mipil Chhiar",
  homeCensusDesc: "Mipil census form thlak la statistics en",
  homeMoreTools: "Thil Pawimawh Zawk",

  homeGoodMorning: "Zingkhuaah Lawmthu",
  homeGoodAfternoon: "Chhandamah Lawmthu",
  homeGoodEvening: "Zanah Lawmthu",
  homePrayerTimesTitle: "Thu Dawt Hunpui",
  homeDawn: "Nitak Thleng",
  homeLatestShema: "Shema Hnung Ber",
  homeNoon: "Chhandam Halachic",
  homeMincha: "Mincha Ketana",
  homePlag: "Plag HaMincha",
  homeTzais: "Tzais HaKochavim",
  homeViewZmanim: "Zmanim Zawng En",
  homeShabbatTitle: "Shabbat",
  homeMemorialTitle: "Memorial Inn Thianghlim",
  homeMemorialDesc: "Ni hmasa te chu hmangaih leh an hriat tur inn thianghlim ah",
  homeOpenSanctuary: "Inn Thianghlim Zuk",
  homeAITitle: "Rav Menashe AI",
  homeAIDesc: "Halacha, tradition, ni thu zawh theih",
  homeAskRavMenashe: "Rav Menashe zawh…",
  homeInsightTitle: "Nizan Torah Thu",
  homeQuickActionsTitle: "Thil Tihpui Dan",

  homeTodaysFocusLabel: "NIZAN PAWIMAWH",
  homeCandleLightingToday: "Katni Mei Nizan",
  homePrepareForShabbat: "Shabbat tan na lungril buatsaih rawh",
  homeTodaysZmanimLabel: "NIZAN ZMANIM",
  homeAllTimesLocal: "Hun Hmun Dan",
  homeMinchaGedola: "Mincha Gedola",
  homeReadSummary: "Sawi Suk En",
  homeOpenDafYomi: "Daf Yomi Zuk",
  homeViewAllHolidays: "Ni Thianghlim Zawng En",
  homeGoPremium: "Premium Nei Ta",
  homeSupportMission: "Mission tanpui la zawng zawng en rawh.",
  homeViewBenefits: "Fimkhur Dan En",
  premiumTitle: "Menashe Premium",
  premiumTagline: "Na biak thlak then hnuaiah zuk lut rawh",
  premiumHeroSubtitle: "Zirna thianghlim, AI thusawi, audio guide, leh zawk",
  premiumComingSoon: "Hnuhnung Tur",
  premiumComingSoonBody: "Premium membership chu hmasawn zawng a ni. Hlawkna thleng theihna chu a awm tawh lo — in hma min pe turin kan thawk tlat a ni. Early access dil turin min contact rawh.",
  premiumContactSupport: "Support Contact Rawh",
  premiumFreeLabel: "Free",
  premiumProLabel: "Premium",
  premiumCompareTitle: "Free vs Premium",
  premiumFeaturesTitle: "Entir Zawng",
  premiumBack: "Zin chhuak",
  premiumEarlyAccess: "Early Access Dil",
  homeSanctuaryAction: "Inn Thianghlim",
  homeStudyAction: "Zir",
  homeMoreAction: "Zawk",
  homeMemorialTagline: "Hriat leh lungngaih hmun thianghlim.",
  homeAITagline: "Zawh. Zir. Hmasawn. Na AI pawl.",
  homeUntilNextShabbatLabel: "SHABBAT THAR HMAA",

  homeSacredTimeLabel: "Hun Thianghlim",
  homeNowLabel: "Tunah",
  homeLearningLabel: "Zirlai",
  homeCommunityPreviewTitle: "Mipil",
  homeCommunityPreviewDesc: "Bnei Menashe mipil khawvel zawng zawng in intlun rawh",
  homeCommunityPreviewCta: "Mipil En",
  homeEnterSanctuary: "Inn Thianghlim Lut",

  homeThisWeekLabel: "Tuni Ni Sagih",
  homeCalendarLink: "Kalenda",
  homeGlanceLabel: "Tuni Chin Vekpi",
  homeFullZmanimLink: "Zmanim Adaptawm",
  homeReadLink: "Sim",

  settingsTitle: "Siam Dan",
  settingsAppearance: "SIM BUATSAIH",
  settingsTheme: "Sim Dan",
  settingsDarkMode: "Zim Bel",
  settingsDarkOn: "Zim bel a khang mek",
  settingsDarkOff: "Lim bel a khang mek",
  settingsShowHebrew: "Hebrew Ni Thu En",
  settingsLanguage: "Thadou Kuki Thu",
  settingsLanguageHint: "Thadou Kuki thuin sim",
  settingsEditTranslations: "✏️ Thadou Kuki Label Siam",
  settingsEditTranslationsHint: "Label dang tak siam theih",
  settingsLocation: "HMUN",
  settingsCity: "Khua",
  settingsCityHint: "Zmanim thlen tan hmang",
  settingsTimezone: "Ni Sung Dan",
  settingsNotifications: "THUPEK HLA",
  settingsCandleLighting: "🕯 Katni Mei",
  settingsHavdalah: "✨ Havdalah",
  settingsShema: "📖 Shema Hnung Ber",
  settingsPrayers: "🕍 Thu Dawt Hla",
  settingsHoliday: "✡ Ni Thianghlim Hla",
  settingsHolidays: "✡ Ni Thianghlim Hla",
  settingsParasha: "📜 Parashah Thupek",
  settingsOmer: "🌾 Omer Chhiar",
  settingsShabbatDigest: "📋 Shabbat Sawi",
  settingsYahrtzeit: "🕯 Yahrtzeit Hla",
  settingsLeadTime: "Hla Dan Thlawhna",
  settingsLeadTimeHint: "Zman hma chuan minit engzat ngai",
  settingsBgPush: "CHHAH HLABU",
  settingsBgPushDesc: "App a tawp ngin emaw device a lock ngemin hlabu dawng theih. Hla dan na siam ang in thlen a ni.",
  settingsBgPushDescUnsupported: "Hei device hian chhah hlabu a support lo.",
  settingsEnablePush: "🔔 Chhah Hlabu On",
  settingsEnablingPush: "A on mek…",
  settingsTestPush: "🧪 Test Hlabu Thawn",
  settingsTestSent: "✓ Thawn Zo!",
  settingsDisablePush: "Off Siam",
  settingsPushActive: "A on mek —",
  settingsTools: "THIL TIHDAN",
  settingsTahara: "Tahara Chhiar",
  settingsTaharaSub: "Mikveh leh ropui dan",
  settingsYartzeitCalc: "Yahrzeit Chhiar",
  settingsYartzeitSub: "Thi ni chhiar",
  settingsBirthday: "Hebrew Nirualna",
  settingsBirthdaySub: "Na nirualna Jewish",
  settingsCommunity: "Mipil",
  settingsCommunitySub: "Bnei Menashe mipil hmun hrang hrang",
  settingsCensus: "Mipil Chhiar",
  settingsCensusSub: "Mipil hmasawn",
  settingsUpgrade: "Premium Nei Ta",
  settingsUpgradeSub: "Zawng zawng en theih — 7 ni bel",
  settingsAccount: "ACCOUNT",
  settingsEditProfile: "Profile Siam",
  settingsEditProfileHint: "I public community profile siam danglam",
  settingsSignOut: "Tawp Ta",
  /* ── Edit Profile screen ── */
  profileTitle: "Ka Profile",
  profileVisibleIn: "Member Directory & Prayer Board-ah a lang",
  profileDisplayName: "Hming Lang",
  profileCongregation: "Khawm Pi / Community",
  profileRole: "Hna",
  profileCountry: "Ram",
  profileCity: "Khua",
  profileBio: "Ka Chanchin",
  profileBioPlaceholder: "I chanchin hrang hrang ziak la (optional)",
  profileUploadPhoto: "Photo Upload",
  profileChangePhoto: "Photo Danglam",
  profileRemovePhoto: "Photo Tlak",
  profilePhotoHint: "5 MB chauh · JPEG leh PNG",
  profilePhotoTooBig: "Photo chu 5 MB a liam tawh. A tlang zawk thlang rawh.",
  profileChooseEmoji: "Avatar Emoji Thlang",
  profileNameRequired: "I hming lang ziak rawh.",
  profileSaveBtn: "Profile Siam Danglam",
  profileSaving: "A siam mek…",
  profileSaved: "✓ A siam ta!",
  profileVisibility: "I profile chu community member dangte hian an en thei.",
  settingsVersion: "Menashe Ni Thu",
  settingsNotifBlocked: "Hlabu a block",
  settingsNotifBlockedSub: "Device siam dan ah app hlabu dawng theihna pe rawh",
  settingsNotifUnsupported: "Hei device hian a support lo",
  settingsNotifActive: "A on mek",

  fabTitle: "Mipil Inn",
  fabAnnouncements: "Thupek",
  fabCommunityEvents: "Mipil Lawmman",
  fabCommunityMemorial: "Mipil Thi Ni",
  fabTorahWisdom: "Torah Thu 48 Dan",
  fabPrayerBoard: "Thu Dawt Hmang",
  fabTorahTracker: "Torah Chhiar",

  sacredStudyBeginJourney: "Na Kholna Pat Din",
  sacredStudyStudyPaths: "Kihilna Lampi",
  sacredStudyJewishCalendar: "Judah Kalendar",
  sacredStudyBookmarks: "Khumkholna",
  sacredStudyRecentlySaved: "Achangin Khumsa",
  sacredStudyNoBookmarks: "Ima khumsa nai lou hi. Kihilna khat kichai teng na mun hi ah khumsa hung um ding ahi.",
  sacredStudyLearningJourney: "Kihilna Kholna",
  sacredStudyStudyDays: "Kihilna Ni",
  sacredStudyLessonsCompleted: "Kihilna Kichaisa",
  sacredStudyThisWeek: "Hiche Hapta Sim",

  sacredMemoryTitle: "Hriatna Thianghlim",
  sacredMemorySubtitle: "Mei chun hriat rawh. Hmangaihna chun zahawm sak rawh.",
  sacredMemoryTodaysRemembrance: "Tunni Hriatna",
  sacredMemoryNoRemembrance: "Tunni ah hriatna rêl a nei lo.",
  sacredMemoryMyFamilyMemorials: "Ka Chhungkua Hriatna",
  sacredMemoryNoFamilyMemorials: "I mei kat sa hriatna te hi hetah hian a lang ding ahi.",
  sacredMemoryLightCandle: "Mei Kat Rawh",
  sacredMemoryLightCandleDesc: "Hmangaih tak i hriat tur chu tap khat hian zahawm sak rawh.",
  sacredMemoryLightCandleCta: "Mei Kat",
  sacredMemoryRecentCandles: "Mei Kat Changkhat",
  sacredMemoryNoRecentCandles: "Mei kat lai a nei lo. I mahni mei kat hmasa ber ni rawh.",
  sacredMemoryPrayerReflection: "Chibai leh Ngaihtuahna",
  sacredMemoryCommunityMemorial: "Mipil Hriatna",
  sacredMemoryViewCommunity: "Mipil Hriatna En Rawh",
  sacredMemoryCandlesLit: "Mei Kat Zat",
  sacredMemoryLearningNow: "Tuna Kihilna",
  sacredMemoryEnterSanctuary: "Inn Thianghlim Lut",
  sacredMemoryEnterSanctuaryCta: "3D Inn Thianghlim Lut Rawh",
  sacredMemoryEnterSanctuaryDesc: "Hriatna Inn Thianghlim thu chu senkhat hmangin lut rawh — mite hriatna eng zawng zawng vak lai zin theihna hmun thianghlim.",
  sacredMemoryEntryLabel: "Hriatna Thianghlim",
  sacredMemoryEntrySub: "Hriat leh Ngaihtuah",

  commHubTitle: "Mipil Inn",
  commHubSubtitle: "Na Bnei Menashe mipil inn",
  commStatPopulation: "MIPIL HLAWM",
  commStatAliyah: "ALIYAH TUAK",
  commStatParshiyot: "PARSHIYOT",
  commIsaiahQuote: "Ka mi sunna bangzah chu A Sung lam pan ka kai zel ang, A Thlang lam pan ka khen zel ang.",
  commIsaiahRef: "Isaiah 43:5",
  commEnterSanctuary: "Inn Thianghlim Lut",
  commAnnouncementsTitle: "Thupek",
  commAnnouncementsSeeAll: "Zawng En",
  commAnnouncementsPinned: "Pin",
  commAnnouncementsEmpty: "Thupek a awm lo",
  commPrayerTitle: "Thu Dawt",
  commPrayerSeeAll: "Zawng En",
  commPrayerAmen: "Amen",
  commPrayerEmpty: "Thu dawt a awm lo",
  commPrayerSubmit: "Thu Dawt Siam",
  commMemorialsTitle: "Mipil Hriatna",
  commMemorialsSeeAll: "Zawng En",
  commMemorialsEmpty: "Hriatna a awm lo",
  commMemorialsCandlesLit: "Mei Kat Zat",
  commMemorialsLearning: "Tuna Kihilna",
  commEventsTitle: "Lawmman Hla",
  commEventsSoon: "Lawmman list a hla mek",
  commOrgsTitle: "Mipil Pawl",
  commOrgsSeeAll: "Zawng zawng en",
  commOrgsScreenDesc: "Bnei Menashe mipil khawvel zawng zawng tanpui pawl leh thilkeu te.",
  commOrgsStatOrgs: "Pawl",
  commOrgVisitSite: "Website En",
  commOrgHotlineDesc: "Halacha leh mipil dotna tur ahi.",
  commOrgNewsletterDesc: "Kha khat hin mipil thu update.",
  commOrgTorahClassesDesc: "Bnei Menashe mipil tan online shiur.",
  dirTitle: "Mipil Directory",
  dirSeeAll: "Zawng zawng en",
  dirHubCardDesc: "Bnei Menashe mipil khawvel zawng zawng zawn la inzawmpui rawh.",
  dirMembersWorldwide: "mipil pawm khawvel zawng zawng",
  dirSearchPlaceholder: "Hming emaw khua emaw zawn…",
  dirNoMembers: "Mipil pawm a awm lo",
  dirNoMatch: "I zawnna hovin mipil a awm lo",
  dirBeFirst: "Hmasa berin i inziak thei!",
  dirConnect: "Inzawmpui",
  dirClose: "Khar",
  dirMemberSince: "Aṭanga mipil",
  dirJoinQuestion: "Bnei Menashe mipil i ni em?",
  dirJoinDesc: "Directory-ah i hming ziak rawh",
  dirJoinButton: "Directory-ah Tel",
  dirLoadError: "Directory chhut theih lo. Ṭhen leh rawh.",
  dirRegisterTitle: "Directory-ah Tel",
  dirEditTitle: "Ka Profile Siam Danglam",
  dirReviewNote: "Directory-ah a lang hma ah admin-in a en tep tep ang.",
  dirAlreadyRegisteredNote: "Directory-ah i hming a lo ziak tawh. Danglamna zawng zawng chu a laiin dah a ni thin.",
  dirFullName: "Hming Kimchang",
  dirFullNamePlaceholder: "I hming kimchang",
  dirCity: "Khua",
  dirCityPlaceholder: "I khua",
  dirCountry: "Ram",
  dirRole: "Mipil Kalpuina Hnathawh",
  dirBio: "Bio Tawi (a ngai lo)",
  dirBioPlaceholder: "Nangma chungchang leh mipil kalpuina i inlaichinna chungchang tlem ziak rawh…",
  dirContactSection: "Biakna Chanchin (a ngai lo)",
  dirContactNote: "Mipil pawm dangte hriat theih ani. I duh loh chuan hawng suh.",
  dirWhatsapp: "WhatsApp Number",
  dirPhone: "Phone Number",
  dirEmail: "Email Address",
  dirOtherContact: "Dang (Telegram, Facebook, etc.)",
  dirOtherContactPlaceholder: "Tv. Telegram @username",
  dirCelebrationSection: "Lawmman Ni (a ngai lo)",
  dirCelebrationNote: "Mipil pawm chuan i ni lawm hun an hriat theih ang che!",
  dirBirthday: "Piannikhua",
  dirAliyahDate: "Aliyah Ni",
  dirNameRequired: "I hming ziak rawh.",
  dirCityRequired: "I khua ziak rawh.",
  dirSubmit: "En Tur Thehluh",
  dirSubmitting: "Theh mek…",
  dirUpdate: "Danglamna Dah",
  dirSubmitFailed: "Thehluh a chhuak lo — ṭhen leh rawh.",
  dirSuccessTitle: "Inziakna Theh A Ni Tawh!",
  dirSuccessDesc: "I profile chu en tur ah a awm tawh. Admin-in a en hnu chuan a lang dawn.",
  dirUpdateSuccessTitle: "Danglamna Dah A Ni Tawh!",
  dirUpdateSuccessDesc: "I directory profile chu siam danglam a ni tawh.",
  dirBackToDirectory: "Directory-ah Kir Leh",
  commOrgConnectDesc: "Na kilkung mipil member te hmuh.",
  commLearningTitle: "Kihilna Pawl",
  commLearningSoon: "Kihilna pawl a hla mek",
  commSynagogueTitle: "Thu Dawt Inn",
  commLightCandle: "Mei Kat",
  commSeeAll: "Zawng En",
  commAnnouncementsNoneTitle: "Thupek a awm lo",
  commAnnouncementsNoneDesc: "Mipil thupek te hi kan thawn hunah hin hetah lang ding ahi.",
  commAnnouncementsPinnedSection: "PIN",
  commAnnouncementsRecentSection: "CHANGKHAT",
  commMemorialsInLovingMemory: "Hmangaihna leh hriatna hnuah",
  commMemorialsAddFirst: "Na hmangaih i hriatna tan mei hmasa ber kat rawh.",
  commMemorialsLightTitle: "Mei Kat",
  commMemorialsLightDesc: "Mipil ah i hmangaih i hriatna tan yahrzeit mei virtual kat rawh.",
  commMemorialsSubmitBtn: "Mei Kat Ta",
  commMemorialsAddedBanner: "Mei a kat — na hriatna a rawn lo ta",
  commMemorialsDedicateTitle: "Kihilna Hlantir",
  commMemorialsDedicateDesc: "Na Torah kihilna hi zahawm na sak tur tan hlantir rawh",
  commMemorialsDedicateBtn: "Ka Kihilna Hlantir",
  commPrayerNone: "Thu dawt a awm lo",
  commPrayerNoneFirst: "Thu dawt thlawhna chuan hmasa ber ni rawh.",
  commPrayerSubmitTitle: "Thu Dawt Thar",
  commPrayerPendingNotice: "Thu dawt te hi a lang hmaa admin-in en a ni.",
  commPrayerSubmittedNotice: "Na thu dawt a kalpui ta — en zo chuan a lang ding ahi.",
  commSynagogueDirectoryTitle: "Thu Dawt Inn List",
  commSynagogueDirectoryDesc: "Bnei Menashe thu dawt inn list a buatsaih mek. Na mipil admin-ah contact la na thu dawt inn register rawh.",
  commEventsComingSoonHint: "Mipil event leh intlunna hla tan Thupek en rawh.",
  commLearningComingSoonHint: "Torah tab-ah kihilna zawng rawh, emaw Prayer Board-ah thu dawt siam rawh.",
  commOrgShaveiDesc: "Bnei Menashe mipil khawvel zawng zawng in intlun leh aliyah Israel-ah pui.",
  commOrgFedDesc: "Mipil inkhawm, kihilna, nunpui dan siamna leh chhungkua tanpui.",
  commOrgShivteiName: "Shivtei Menashe",
  commOrgShivteiTagline: "Menashe Mipil Inzawng Nawn",
  commOrgShivteiDesc: "Bnei Menashe mipil Israel-ah leh khawvel zawng zawng-ah tanpui nonprofit — spiritually, culturally, leh historically.",
  commEventsSeeAll: "Zawng En",
  commEventsEmpty: "Lawmman a awm lo. Hla in chhawn rawh.",
  commEventsScreenTitle: "Lawmman Hla",
  commEventsToday: "Tuna",
  commEventsTomorrow: "Thar",
  commEventsWeekly: "Sunthal",
  commEventsMonthly: "Thla Tin",
  commLearningSeeAll: "Pawl zawng en",
  commLearningScreenDesc: "Bnei Menashe mipil tan Torah kihilna — kumpi zawng, nu leh pa zawng tan.",
  commLearningNewGroupTitle: "Kihilna Pawl Siam",
  commLearningNewGroupDesc: "Na khua ah kihilna la zawn duh em? Na list-ah thlan nan contact rawh.",
  commLearningOpenToAll: "Thu zawng tan",
  commLearningWomenOnly: "Nu-te tan",
  commSynagogueSeeAll: "List en rawh",
  commSynagogueScreenDesc: "Bnei Menashe thu dawt inn leh mipil hmun khawvel zawng zawng.",
  commSynagogueRegisterTitle: "Na Thu Dawt Inn Register",
  commSynagogueRegisterDesc: "Na detail submit la, list-ah thlan a ni ang.",
  commSynagogueStatLocations: "HMUN",
  commSynagogueStatCountries: "RAMRI",
  commSynagogueStatMembers: "MIPIL",
  commSynagogueTypeBK: "Beit Knesset",
  commSynagogueTypePG: "Thupui Pawl",
  commSynagogueTypeCC: "Mipil Inn",
  commSynagogueFormTitle: "Na Thu Dawt Inn Register",
  commSynagogueFormSubtitle: "Hnuai ah na detail submit la, hmu tir zing ang che.",
  commSynagogueFormName: "Thu Dawt Inn Hming",
  commSynagogueFormNamePlaceholder: "eg. Beit Knesset Bnei Menashe",
  commSynagogueFormCity: "Khua",
  commSynagogueFormCityPlaceholder: "eg. Churachandpur",
  commSynagogueFormCountry: "Ramri",
  commSynagogueFormCountryPlaceholder: "eg. India",
  commSynagogueFormType: "Lokal",
  commSynagogueFormContact: "Contact Email",
  commSynagogueFormContactPlaceholder: "eg. rabbi@synagogue.org",
  commSynagogueFormDescription: "Describe",
  commSynagogueFormDescriptionPlaceholder: "Thupui, mipil leh zirna thu siam rawh…",
  commSynagogueFormSubmit: "Submit",
  commSynagogueFormCancel: "Cancel",
  commSynagogueFormDone: "Zo Tawh",
  commSynagogueFormSuccess: "Submit In Zo!",
  commSynagogueFormSuccessDesc: "Lawmthu. A review a ni ang leh list-ah zet a ni ang.",
  commSynagogueFormError: "Submit a tling lo. Lo chhawn rawh.",
  commSynagogueFormRequired: "Hming, khua leh ramri a ngai.",
  commSynagogueFormEmailInvalid: "Email dik tak siam rawh.",
  commBack: "Chhawn",
  commContact: "Contact",
  commMap: "Hmun En",
  commMembersCount: "mipil",

  txEditorTitle: "Thadou Kuki Label Siam",
  txEditorSubtitle: "Label dang tak chu hnuaiah siam rawh. Na device-ah chhuang a ni.",
  txEditorSave: "Chhuang Ta",
  txEditorSaved: "✓ Chhuangin zo!",
  txEditorReset: "Default Ah Chhawn",
  txEditorResetConfirm: "Thadou Kuki label zawng zawng default-ah chhawn ang em?",
  txEditorSearch: "Label zawng…",
  txEditorEnglish: "English",
  txEditorThadou: "Thadou Kuki",
  txEditorGroupNav: "Lampi (Nav)",
  txEditorGroupHome: "Inn Page",
  txEditorGroupSettings: "Siam Dan",
  txEditorGroupFab: "Mipil Inn",
  txEditorNote: "Tip: Thadou Kuki mode on siam la (Siam Dan → Thu) nakin na siam zawng en theih.",

  commJustNow: "Tunah taka",
  commMinAgo: "{n}m a hla",
  commHourAgo: "{n}h a hla",
  commDayAgo: "{n}ni a hla",

  sacredWisdomTitle: "Thu Thianghlim",
  sacredWisdomTagline: "Zir. Zawh. Hmu.",
  sacredWisdomPlaceholder: "Rav Menashe-ah na zawh duh zawng zawh rawh…",
  sacredWisdomSuggestedTitle: "Zawh Thiam Dan",
  sacredWisdomContinueTitle: "Zir Zel",
  sacredWisdomLibraryTitle: "Zirna Inn",
  sacredWisdomQ1: "Nizan Parashah engzat am ni?",
  sacredWisdomQ2: "Nizan Daf Yomi explain siam rawh",
  sacredWisdomQ3: "Shabbat katni mei hunlai engzat am ni?",
  sacredWisdomQ4: "Shema meaning engzat am ni?",
  sacredWisdomQ5: "Bnei Menashe zuangthu hrilh sak rawh",
  sacredWisdomQ6: "Havdalah engzat ni leh entir dan eng am ni?",
  sacredWisdomQ7: "Shabbat pawimawh dan explain siam rawh",
  sacredWisdomQ8: "Bnei Menashe te heng an ni?",
  sacredWisdomTopicJudaism: "Judah Thu",
  sacredWisdomTopicHebrew: "Hebrew",
  sacredWisdomTopicPrayer: "Thu Dawt",
  sacredWisdomTopicTorah: "Torah",
  sacredWisdomTopicBneiMenashe: "Bnei Menashe",
  sacredWisdomTopicCalendar: "Ni Thu",
  sacredWisdomTopicHistory: "History",

  settingsAlertOk: "Aw",
  settingsAlertCancel: "Cancel",
  settingsAlertNotifBlockedTitle: "Hlabu a block",
  settingsAlertNotifBlockedMsg: "Menashe Calendar-a hlabu dawng theihnan device siam dan ah app hlabu on rawh.",
  settingsAlertScheduledTitle: "Zo Tawh",
  settingsAlertScheduledMsg: "{n} hlabu na device-ah a rêl tawh.",
  settingsAlertPermDeniedTitle: "Siamsak Theilo",
  settingsAlertPermDeniedMsg: "Hlabu on theilo. Device siam dan en rawh.",
  settingsAlertServerPushTitle: "Server Push On",
  settingsAlertServerPushMsg: "App a tawp emaw, Shabbat leh ni thianghlim hlabu server lam pan dawng a ni ding.",
  settingsAlertErrorTitle: "Thil Dang",
  settingsAlertServerPushErrMsg: "Server push siam theilo.",
  settingsAlertTestSentTitle: "Test Thawn Zo",
  settingsAlertTestSentMsg: "Test hlabu server lam pan thawn tawh. A tlang zel ang.",
  settingsAlertTestFailMsg: "Test hlabu thawn theilo.",
  settingsAlertSignOutTitle: "Tawp Ta",
  settingsAlertSignOutMsg: "Tawp duh am?",

  settingsThemeMidnight: "Tlaibawk",
  settingsThemeParchment: "Lehthlalang",
  settingsThemeSapphire: "Sapphire",
  settingsNotifCandleLighting: "Katni Mei",
  settingsNotifHavdalah: "Havdalah",
  settingsNotifParasha: "Parashah Thupek",
  settingsNotifHolidayAlerts: "Ni Thianghlim Hla",
  settingsNotifPrayerReminders: "Thu Dawt Hla Dan",
  settingsNotifShabbatSub: "Shabbat hma minit 18",
  settingsNotifHavdalahSub: "Shabbat tawp hnu",
  settingsNotifParashaSub: "Zirtawpni tûk hla",
  settingsNotifHolidaySub: "Ni thianghlim hma ni",
  settingsNotifPrayersSub: "Shacharit, Mincha, Maariv",
  settingsScheduled: "DIN ZO",
  settingsScheduledCount: "Hlabu {n} din zo",
  settingsEnableAllNotif: "Hlabu Zawng Zawng On",
  settingsRescheduleNow: "Thar Dah Leh",
  settingsRescheduling: "A thar dah mek...",
  settingsLocalNotifDesc: "Hlabu chu app a tawp ngin emaw device a lock ngemin na device notification bar-ah a lang. Na device-ah a din a ni — internet a ngai lo.",
  settingsServerPushSection: "SERVER PUSH HLABU",
  settingsServerPushLabel: "Server Push",
  settingsServerPushActiveDesc: "Shabbat leh ni thianghlim hla server in a thlen",
  settingsServerPushInactiveDesc: "Server hlabu dawng nan on rawh",
  settingsSendingPush: "A thawn mek...",
  settingsSendTestNotif: "Test Hlabu Thawn",
  settingsServerPushFullDesc: "Server push hian Shabbat katni mei, Havdalah, Parasha, leh ni thianghlim hla chu Bnei Menashe server atangin a thlen — ni tam tak in app i hawng ngai lo emaw.",
  settingsSignedIn: "I lut zo",
  settingsSignOutHint: "Sign-in screen-ah i lo thleng leh ang.",
  settingsSelectLocation: "Hmun Dah",
  settingsLocationUtc: "Timezone in UTC offset",
  locationDetectGps: "Ka Hmun Hmang",
  locationDetecting: "Hmun dih in…",
  locationGpsError: "Hmun la hmang thei lo. Hmun dang dah rawh.",
  locationSearchPlaceholder: "Hmun ziah…",
  settingsYourAccount: "I account",
  settingsLeadTimeSection: "HMASAWN NI DAN (THU DAWT)",
};

const sharedTranslations: Record<Lang, SharedTranslations> = { en: sharedEn, tk: sharedTk };
export default sharedTranslations;
