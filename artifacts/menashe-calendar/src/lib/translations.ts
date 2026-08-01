export type Lang = "en" | "tk";

export interface Translations {
  /* ── Landing ── */
  landingBadge: string;
  landingHero: string;
  landingSubtitle: string;
  landingSignIn: string;
  landingFree: string;
  landingScroll: string;
  landingFeaturesEyebrow: string;
  landingFeaturesHeading: string;
  landingFeaturesSubHeading: string;
  featureZmanimTitle: string;
  featureZmanimDesc: string;
  featureTorahTitle: string;
  featureTorahDesc: string;
  featureCommunityTitle: string;
  featureCommunityDesc: string;
  statsParashot: string;
  statsHolidays: string;
  statsCommunities: string;
  ctaHeading: string;
  ctaSubtitle: string;

  /* ── BottomNav ── */
  navHome: string;
  navCalendar: string;
  navZmanim: string;
  navSiddur: string;
  navSettings: string;
  navChat: string;
  navNotifications: string;
  libraryBrowseCategories: string;

  /* ── Beta Feedback ── */
  feedbackButtonLabel: string;
  feedbackTitle: string;
  feedbackSubtitle: string;
  feedbackCategory: string;
  feedbackCategoryBug: string;
  feedbackCategoryUx: string;
  feedbackCategoryContent: string;
  feedbackCategoryPerf: string;
  feedbackCategorySuggest: string;
  feedbackPriority: string;
  feedbackPriorityCritical: string;
  feedbackPriorityHigh: string;
  feedbackPriorityMedium: string;
  feedbackPriorityLow: string;
  feedbackMessage: string;
  feedbackMessagePlaceholder: string;
  feedbackSubmit: string;
  feedbackSubmitting: string;
  feedbackSuccess: string;
  feedbackSuccessDetail: string;
  feedbackClose: string;
  feedbackError: string;

  /* ── Feedback Center (PEP-705) ── */
  fcHelpSupportSection: string;
  fcHelpSupportSub: string;

  /* ── Settings ── */
  settingsTitle: string;
  settingsLocation: string;
  settingsCity: string;
  settingsCityHint: string;
  settingsTimezone: string;
  settingsAppearance: string;
  settingsDarkMode: string;
  settingsDarkOn: string;
  settingsDarkOff: string;
  settingsShowHebrew: string;
  settingsLanguage: string;
  settingsLanguageHint: string;
  settingsEditTranslations: string;
  settingsEditTranslationsHint: string;
  settingsNotifications: string;
  settingsCandleLighting: string;
  settingsHavdalah: string;
  settingsShema: string;
  settingsPrayers: string;
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
  settingsSignOut: string;
  settingsVersion: string;
  settingsNotifBlocked: string;
  settingsNotifBlockedSub: string;
  settingsNotifUnsupported: string;
  settingsNotifActive: string;

  /* ── Home ── */
  homeToday: string;
  homeHebrewDate: string;
  homeGregorian: string;
  homeHebrewYear: string;
  homeZmanim: string;
  homeViewAll: string;
  homeSunrise: string;
  homeSunset: string;
  homeCandleLighting: string;
  homeHavdalahTonight: string;
  homeShabbatShalom: string;
  homeShabbatInProgress: string;
  homeHavdalahAt: string;
  homeShavuaTov: string;
  homeDailyTorah: string;
  homeReadMore: string;
  homeShowLess: string;
  homeShare: string;
  homeTodayHoliday: string;
  homeChagSameach: string;
  homeCommunityTitle: string;
  homeCommunityDesc: string;
  homeMembersTitle: string;
  homeMembersDesc: string;
  homeCensusTitle: string;
  homeCensusDesc: string;
  homeUpcomingHolidays: string;
  homeNoHolidays: string;
  homeParashah: string;
  homeDafYomi: string;
  homeMoreTools: string;
  annStripNew: string;
  celebTitle: string;
  celebDirLink: string;
  celebTypeBirthday: string;
  celebTypeAliyah: string;
  celebToday: string;
  celebTomorrow: string;
  celebInDays: string;
  annStripNews: string;
  annStripRead: string;
  shabbatBarTitle: string;
  shabbatBarTrialBadge: string;
  shabbatBarTrialEnd: string;
  shabbatBarUpgradeBtn: string;
  shabbatBarTonightLabel: string;
  shabbatBarPremiumBadge: string;
  homeOmer: string;
  omerSefiratTitle: string;
  omerDayCount: string;
  omerDaysLeft: string;
  omerDayLeft: string;

  /* ── Community FAB ── */
  fabTitle: string;
  fabAnnouncements: string;
  fabCommunityEvents: string;
  fabCommunityMemorial: string;
  fabTorahWisdom: string;
  fabPrayerBoard: string;
  fabTorahTracker: string;
  fabLocationMap: string;
  fabCompass: string;
  compassJerusalem: string;
  compassBearing: string;
  compassDistKm: string;
  compassFromCity: string;

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
  txEditorGroupLanding: string;
  txEditorGroupNav: string;
  txEditorGroupSettings: string;
  txEditorGroupHome: string;
  txEditorNote: string;

  /* ── Rosh Chodesh banner ── */
  roshChodeshLabel: string;
  roshChodeshTodayTitle: string;
  roshChodeshTodaySub: string;
  roshChodeshTomorrowTitle: string;
  roshChodeshTomorrowSub: string;

  /* ── Shabbat banner ── */
  shabbatApproaching: string;
  shabbatShalomEn: string;
  shabbatShalomTk: string;
  shabbatCandleLighting: string;
  shabbatHavdalah: string;
  shabbatMinutes: string;
  shabbatModeActive: string;
  shabbatModeHavdalahIn: string;
  shabbatModeCandleLightingIn: string;
  shabbatModeShavuaTov: string;
  shabbatModeDismiss: string;

  /* ── Settings: What's New entry ── */
  settingsWhatsNew: string;
  settingsWhatsNewSub: string;

  /* ── What's New ── */
  whatsNewTitle: string;
  whatsNewSubtitle: string;
  whatsNewGotIt: string;

  /* ── Splash screen ── */
  splashTagline: string;

  /* ── Onboarding ── */
  onboardingStep: string;
  onboardingSkip: string;
  onboardingNext: string;
  onboardingGetStarted: string;
  onboardingLangTitle: string;
  onboardingLangSubtitle: string;
  onboardingLocTitle: string;
  onboardingLocSubtitle: string;
  onboardingLocDetect: string;
  onboardingLocDetecting: string;
  onboardingLocSelected: string;
  onboardingNotifTitle: string;
  onboardingNotifSubtitle: string;
  onboardingNotifEnable: string;
  onboardingNotifLater: string;
  onboardingNotifEnabled: string;
  onboardingNotifDenied: string;

  /* ── Install prompt ── */
  installTitle: string;
  installBody: string;
  installBtn: string;
  installDismiss: string;

  /* ── SW update toast ── */
  updateAvailable: string;
  updateRefresh: string;
  updateDismiss: string;

  /* ── Profile photo upload ── */
  profileUploadPhoto: string;
  profileChangePhoto: string;
  profileRemovePhoto: string;
  profilePhotoHint: string;
  profilePhotoTooBig: string;

  /* ── Tahara Modal ── */
  taharaTitle: string;
  taharaSub: string;
  taharaPeriodLabel: string;
  taharaCalculate: string;
  taharaHefsek: string;
  taharaMikveh: string;
  taharaPosekNote: string;
  taharaClose: string;
  taharaMikvehCalendar: string;
  taharaMikvehCalendarSub: string;
  /* ── Mikveh Calendar Modal ── */
  mikvehCalTitle: string;
  mikvehCalUpcomingLabel: string;
  mikvehCalUpcoming: string;
  mikvehCalPast: string;
  mikvehCalAll: string;
  mikvehCalEmptyTitle: string;
  mikvehCalEmptySub: string;
  mikvehCalEmptyFilter: string;
  mikvehCalMikvehNight: string;
  mikvehCalHefsek: string;
  mikvehCalMikveh: string;
  mikvehCalDone: string;
  mikvehCalTonight: string;
  mikvehCalIn: string;
  mikvehCalMarkDone: string;
  mikvehCalMarkPending: string;
  mikvehCalDelete: string;
  mikvehCalPrivacy: string;
  mikvehCalSaveBtn: string;
  mikvehCalSaved: string;
  back: string;

  /* ── Yahrzeit Modal ── */
  yartzeitTitle: string;
  yartzeitSub: string;
  yartzeitSavedReminders: string;
  yartzeitNameLabel: string;
  yartzeitDateLabel: string;
  yartzeitTimeLabel: string;
  yartzeitTimeUnknown: string;
  yartzeitCalculate: string;
  yartzeitSaveReminder: string;
  yartzeitSaved: string;
  yartzeitAddNew: string;
  yartzeitHalachicNote: string;
  yartzeitClose: string;

  /* ── Daf Yomi Modal ── */
  dafYomiTitle: string;
  dafYomiSub: string;
  dafYomiReadSefaria: string;
  dafYomiCopied: string;
  dafYomiShare: string;
  dafYomiLoading: string;
  dafYomiError: string;

  /* ── Holidays Modal ── */
  holidaysTitle: string;
  holidaysCategoryYomTov: string;
  holidaysCategoryFast: string;
  holidaysCategoryMinor: string;
  holidaysCategoryRoshChodesh: string;
  holidaysCategoryModern: string;
  holidaysCategoryShabbat: string;
  holidaysMussarLesson: string;
  holidaysSpiritualTheme: string;
  holidaysInsightsSoon: string;

  /* ── Prayer Board Modal ── */
  prayerBoardTitle: string;
  prayerBoardAdminAccess: string;
  prayerBoardAdminPin: string;
  prayerBoardSubmitTitle: string;
  prayerBoardCategory: string;
  prayerBoardAnonymous: string;
  prayerBoardSubmit: string;
  prayerBoardModerate: string;
  prayerBoardResponse: string;
  prayerBoardAmen: string;
  prayerBoardPending: string;
  prayerBoardApprove: string;
  prayerBoardRemove: string;

  /* ── Premium Modal ── */
  premiumTitle: string;
  premiumSubtitle: string;
  premiumSecure: string;
  premiumCancel: string;
  premiumPayment: string;
  premiumReviewed: string;

  /* ── Not Found ── */
  notFoundTitle: string;
  notFoundHome: string;

  /* ── Week Strip ── */
  weekStripTitle: string;
  weekStripViewCal: string;
  weekStripDaySun: string;
  weekStripDayMon: string;
  weekStripDayTue: string;
  weekStripDayWed: string;
  weekStripDayThu: string;
  weekStripDayFri: string;
  weekStripDaySat: string;

  /* ── Zmanim Timeline ── */
  zmanimTimelineTitle: string;
  zmanimTimelineDawn: string;
  zmanimTimelineSunrise: string;
  zmanimTimelineShema: string;
  zmanimTimelineMidday: string;
  zmanimTimelineMincha: string;
  zmanimTimelineSunset: string;
  zmanimTimelineNightfall: string;
  zmanimTimelineNow: string;
  zmanimTimelineTap: string;
  nextHolidayTitle: string;
  nextHolidayDaysSingle: string;
  nextHolidayDaysPlural: string;
  nextHolidayToday: string;
  nextHolidayTomorrow: string;
  nextHolidayHide: string;
  nextHolidayShow: string;
  nextHolidayHalachaTitle: string;
  nextHolidayHalachaSource: string;
  nextHolidayHalachaLoading: string;
  nextHolidayHalachaError: string;
  nextHolidayPushTitle: string;
  nextHolidayPushBody: string;
  nextHolidayChecklistProgress: string;
  nextHolidayChecklistReset: string;
  nextHolidayChecklistAllDone: string;
  nextHolidayShareBtn: string;
  nextHolidayShareCardTitle: string;
  nextHolidayShareCardBrand: string;
  nextHolidayShareCardProgress: string;
  nextHolidayShareCardOf: string;
  nextHolidayShareCardStepsComplete: string;
  nextHolidayShareCardUnchecked: string;
  nextHolidayShareAction: string;
  nextHolidayShareCopied: string;
  nextHolidayShareClose: string;
  birthdayTrackerTitle: string;
  birthdayTrackerSub: string;
  birthdayTrackerGregorianLabel: string;
  birthdayTrackerHebrewLabel: string;
  birthdayTrackerNextLabel: string;
  birthdayTrackerCalculate: string;
  birthdayTrackerSave: string;
  birthdayTrackerSaved: string;
  birthdayTrackerClear: string;
  birthdayTrackerToday: string;
  birthdayTrackerCardTitle: string;
  birthdayTrackerCardDays: string;
  birthdayTrackerCardSetup: string;
  modalClose: string;
  yartzeitCardTitle: string;
  yartzeitCardSetup: string;
  yartzeitCardToday: string;
  yartzeitCardDays: string;
  yartzeitCardUpcoming: string;
  yartzeitCardManage: string;
  yartzeitCardObservances: string;
  yartzeitCardObservanceText: string;
  yartzeitCardDay: string;
  yartzeitCardPushOff: string;
  yartzeitCardPushOn: string;

  /* ── Parasha Anniversaries ── */
  parashaAnnivTitle: string;
  parashaAnnivYahrzeit: string;
  parashaAnnivBirthday: string;
  parashaAnnivEvent: string;
  parashaAnnivEmpty: string;
  parashaAnnivExpand: string;

  /* ── AI Chat Assistant ── */
  chatTitle: string;
  chatSubtitle: string;
  chatWelcomeTitle: string;
  chatWelcomeDesc: string;
  chatPlaceholder: string;
  chatDisclaimer: string;
  chatError: string;
  chatFabLabel: string;
  chatVoiceStart: string;
  chatVoiceStop: string;
  chatVoiceUnsupported: string;
  chatShare: string;
  chatCopied: string;
  chatSuggestLabel: string;
  chatSuggestedQuestions: string[];

  /* ── Memorial Sanctuary ── */
  memTitle: string;
  memSubtitle: string;
  memEnteringSanctuary: string;
  memLoadingScene: string;
  memInitializingWebGL: string;
  memBuildingValley: string;
  memPlacingMemorials: string;
  memLightingCandles: string;
  memAlmostReady: string;
  memSearchPlaceholder: string;
  memGoldenHour: string;
  memCandlesLit: string;
  memInLovingMemory: string;
  memNavHome: string;
  memNavMemorials: string;
  memHintDrag: string;
  memHintPinch: string;
  memHintTap: string;
  memLightCandle: string;
  memLightCandleSub: string;
  memFullName: string;
  memFullNamePlaceholder: string;
  memHebrewName: string;
  memDateOfPassing: string;
  memMemorialMessage: string;
  memMessagePlaceholder: string;
  memLightingCandle: string;
  memLightTheCandle: string;
  memCandleLit: string;
  memMemoryBlessing: string;
  memDedicatedLearning: string;
  memLeaveTribute: string;
  memYourName: string;
  memStudySubject: string;
  memSubmitting: string;
  memDedicate: string;
  memTributeRecorded: string;
  memNoResults: string;
  memClearSearch: string;
  memCandlesCount: string;
  memLitBy: string;
  memPlaceFlower: string;
  memFlowersBtn: string;
  memChooseFlowerColor: string;
  memPlaceFlowerBtn: string;
  memFlowersInGarden: string;
  /* ── Memorial Shell (SPR-015) ── */
  memShellWelcome: string;
  memShellWelcomeSub: string;
  memShellFeatured: string;
  memShellRecentCandles: string;
  memShellFamilyMemorials: string;
  memShellCreate: string;
  memShellCreateSub: string;
  memShellEnter3D: string;
  memShellEnter3DSub: string;
  memShellResults: string;
  memShellViewAll: string;
  memShellLoadMore: string;
  memShellLoading: string;
  memShellEmptySearch: string;
  memShellSearchError: string;
  memShellRetry: string;
  memShellFeaturedEmpty: string;
  memShellFeaturedEmptySub: string;
  memShellRecentEmpty: string;
  memShellRecentEmptySub: string;
  memShellFamilyEmpty: string;
  memShellFamilyEmptySub: string;
  memShellOffline: string;
  memShellOfflineSub: string;
  memProfileBorn: string;
  memProfileDied: string;
  memProfileAge: string;
  memProfileYears: string;
  memProfileBiography: string;
  memProfileRecentTributes: string;
  memProfileRecentCandles: string;
  memProfileUpcomingYahrzeit: string;
  memProfileFamilySection: string;
  memProfileLocationSection: string;
  memProfileActionLight: string;
  memProfileActionTribute: string;
  memProfileActionPhotos: string;
  memProfileActionShare: string;
  memProfileCopied: string;
  memProfilePrivateBadge: string;
  memProfileFamilyBadge: string;
  memProfileCommunityBadge: string;
  memProfilePublicBadge: string;
  memProfileNotFound: string;
  memProfileNotFoundSub: string;
  memProfilePrivate: string;
  memProfilePrivateSub: string;
  memProfileNoBio: string;
  memProfileNoTributes: string;
  memProfileNoCandles: string;
  memProfileNoFamily: string;
  memProfileNoYahrzeit: string;
  memProfileNoLocation: string;
  memProfileYahrzeitNext: string;
  memProfileYahrzeitToday: string;
  memProfileDaysAway: string;
  memCandleTabRecent: string;
  memCandleTabToday: string;
  memCandleTabCommunity: string;
  memCandleRelationship: string;
  memCandleCommunityField: string;
  memCandleRelationshipPlaceholder: string;
  memTributeTypeLabel: string;
  memTributeTypeAll: string;
  memTributeTypeMemory: string;
  memTributeTypePrayer: string;
  memTributeTypeScripture: string;
  memTributeTypeFamily: string;
  memTributeCommunityType: string;
  memFamilyManage: string;
  memFamilyInvite: string;
  memFamilyUserId: string;
  memFamilySelectRole: string;
  memFamilyRoleAdmin: string;
  memFamilyRoleMember: string;
  memFamilyRoleViewer: string;
  memFamilyRemove: string;
  memFamilyTransfer: string;
  memFamilyInviting: string;
  memFamilyInvited: string;
  memFamilyNoMembers: string;
  memFamilyPrimaryContact: string;
  memYahrzeitAlertToday: string;
  memYahrzeitAlertSoon: string;
  memYahrzeitSuggestPrayer: string;
  memYahrzeitSuggestPsalm: string;
  memYahrzeitSuggestCandle: string;
  memColRecentlyRemembered: string;
  memColMostVisited: string;
  memColRecentlyLit: string;
  memColUpcomingYahrzeit: string;
  memColCommunityPicks: string;
  memLoadMore: string;
  /* ── Memorial Sanctuary SPR-035 ── */
  memNavFlowers: string;
  memNavMessages: string;
  memNavMusic: string;
  memSceneValley: string;
  memSceneGarden: string;
  memSceneWaterfall: string;
  memSceneSanctuary: string;
  memSceneSunset: string;
  memAmbientOn: string;
  memAmbientOff: string;
  memNoRecentActivity: string;
  memTodayRemembrance: string;
  memLightFirstCandle: string;
  memSceneLoadError: string;
  memTimelineTitle: string;
  memTimelineJourney: string;
  memTimelineRemembered: string;
  memWalkEntrance: string;
  memWalkOverview: string;
  memWalkMode: string;

  /* ── Journey Page ── */
  navJourney: string;
  journeyTitle: string;
  journeySubtitle: string;
  journeyEditProfile: string;
  journeyMemberSince: string;
  journeyStreak: string;
  journeyCandles: string;
  journeyAchievements: string;
  journeyBadgesEarned: string;
  journeyActivity: string;
  journeySaved: string;
  journeyGoals: string;
  journeyAccount: string;
  journeySettings: string;
  journeyPremium: string;
  journeyHelp: string;
  journeySignOut: string;
  journeyNoActivity: string;
  journeyStudySession: string;
  journeyTorahGoal: string;
  journeyWeeklyProgress: string;
  journeyBookmarks: string;
  journeyOpenSiddur: string;
  journeyPersonal: string;
  journeyNotSignedIn: string;

  /* ── Notifications Page ── */
  notifPageTitle: string;
  notifMarkAllRead: string;
  notifTabAll: string;
  notifTabTorah: string;
  notifTabPrayer: string;
  notifTabHolidays: string;
  notifTabCommunity: string;
  notifTabAccount: string;
  notifEmptyCta: string;
  notifActivityTitle: string;
  notifQuickActions: string;
  notifResumeStudy: string;
  notifPrayerTimes: string;
  notifOpenYahrzeit: string;
  notifOpenCommunity: string;
  notifSettingsTitle: string;
  notifPrayerReminders: string;
  notifPrayerRemindersSub: string;
  notifShabbatCandles: string;
  notifShabbatCandlesSub: string;
  notifHavdalahReminder: string;
  notifShemaReminder: string;
  notifShemaReminderSub: string;
  notifTorahReminders: string;
  notifTorahRemindersSub: string;
  notifHolidayReminders: string;
  notifHolidayRemindersSub: string;
  notifYahrzeitReminders: string;
  notifOmerCount: string;
  notifShabbatDigest: string;
  notifShabbatDigestSub: string;
  notifLeadTime: string;
  notifPushNotifications: string;
  notifPushSubscribe: string;
  notifPushUnsubscribe: string;
  notifPushTest: string;
  notifPermissionDenied: string;
  notifRetry: string;
  notifNoActivity: string;
  notifStartStudy: string;

  /* ── Notifications Page (extended) ── */
  notifFilterUnread: string;
  notifFilterRead: string;
  notifAllCaughtUp: string;
  notifAllCaughtUpSub: string;
  notifQuietHours: string;
  notifQuietHoursDesc: string;
  notifQuietFrom: string;
  notifQuietTo: string;
  notifPushActive: string;
  notifPushInactive: string;
  notifSignInMsg: string;
  notifErrorTitle: string;
  notifErrorSub: string;
  notifUnread: string;
  notifBack: string;

  /* ── Remembrance Center ── */
  remembranceTitle: string;
  remembranceSubtitle: string;
  remembranceAdd: string;
  remembranceUpcoming: string;
  remembranceYahrzeits: string;
  remembranceBirthdays: string;
  remembranceAnniversaries: string;
  remembranceEvents: string;
  remembranceNoEvents: string;
  remembranceNoEventsSub: string;
  remembranceLoading: string;
  remembranceLoadError: string;
  remembranceRetry: string;
  remembranceToday: string;
  remembranceTomorrow: string;
  remembranceInDays: string;
  remembranceYahrzeit: string;
  remembranceBirthday: string;
  remembranceAnniversary: string;
  remembranceNewEvent: string;
  remembranceEditEvent: string;
  remembranceDetails: string;
  remembranceName: string;
  remembranceRelationship: string;
  remembranceEventType: string;
  remembranceDate: string;
  remembranceMonth: string;
  remembranceYear: string;
  remembranceDayLabel: string;
  remembranceHebrewDate: string;
  remembranceGregorianDate: string;
  remembranceUseHebrewDate: string;
  remembranceBeforeSunset: string;
  remembranceRepeatAnnually: string;
  remembranceLocation: string;
  remembranceNotes: string;
  remembranceNotesPlaceholder: string;
  remembranceNotifications: string;
  remembranceEnableNotifications: string;
  remembranceDaysBefore: string;
  remembranceNotificationTime: string;
  remembranceCensusLink: string;
  remembranceCensusNone: string;
  remembranceCensusLoading: string;
  remembranceCensusUnavailable: string;
  remembranceSave: string;
  remembranceCancel: string;
  remembranceDelete: string;
  remembranceDeleteConfirm: string;
  remembranceDeleteBody: string;
  remembranceConfirmDelete: string;
  remembranceShare: string;
  remembranceCopied: string;
  remembranceShareFailed: string;
  remembranceClose: string;
  remembranceRequired: string;
  remembranceSaved: string;
  remembranceDays: string;
  remembranceDay: string;
  remembranceNoDate: string;
  remembranceAddYahrzeit: string;
  remembranceAddBirthday: string;
  remembranceAddAnniversary: string;
  remembranceShareFamilyCalendar: string;
  remembrance20YearSchedule: string;
  remembranceExportICS: string;
  remembranceICSDownloaded: string;
  remembranceNoYahrzeits: string;
  remembranceNoBirthdays: string;
  remembranceNoAnniversaries: string;
}

/* ──────────────────────────────────────────────────────────────
   ENGLISH
────────────────────────────────────────────────────────────── */
export const en: Translations = {
  landingBadge: "BNEI MENASHE",
  landingHero: "The Sacred Calendar\nof Bnei Menashe",
  landingSubtitle: "Accurate Zmanim, Torah wisdom, Jewish holidays, and community resources — all in one spiritual home.",
  landingSignIn: "Sign In",
  landingFree: "Free for the community · No account needed",
  landingScroll: "SCROLL",
  landingFeaturesEyebrow: "EVERYTHING YOU NEED",
  landingFeaturesHeading: "Your complete Jewish\nspiritual companion",
  landingFeaturesSubHeading: "Your complete Jewish spiritual companion",
  featureZmanimTitle: "Accurate Zmanim",
  featureZmanimDesc: "Precise daily prayer times calculated for your exact location — Shacharit, Mincha, Maariv, Shabbat candles, and more.",
  featureTorahTitle: "Torah Insights",
  featureTorahDesc: "Weekly Parashah, Daf Yomi, Siddur Library, and curated Torah wisdom for continuous Jewish learning.",
  featureCommunityTitle: "Community Hub",
  featureCommunityDesc: "Announcements, events, Yahrtzeit reminders, and resources tailored for the Bnei Menashe community worldwide.",
  statsParashot: "Weekly Parashot",
  statsHolidays: "Holiday Resources",
  statsCommunities: "Communities",
  ctaHeading: "Begin your journey",
  ctaSubtitle: "Join the Bnei Menashe community — free for everyone.",

  navHome: "Home",
  navCalendar: "Calendar",
  navZmanim: "Zmanim",
  navSiddur: "Siddur",
  navSettings: "Settings",
  navChat: "Chat",
  navNotifications: "Notifications",
  libraryBrowseCategories: "Browse by category",

  /* ── Beta Feedback ── */
  feedbackButtonLabel: "Feedback",
  feedbackTitle: "Share Feedback",
  feedbackSubtitle: "Help us improve the platform for the whole community.",
  feedbackCategory: "Category",
  feedbackCategoryBug: "Bug",
  feedbackCategoryUx: "Confusing Workflow",
  feedbackCategoryContent: "Missing Content",
  feedbackCategoryPerf: "Performance",
  feedbackCategorySuggest: "Suggestion",
  feedbackPriority: "How urgent?",
  feedbackPriorityCritical: "Critical — can't use the app",
  feedbackPriorityHigh: "High — major feature broken",
  feedbackPriorityMedium: "Medium — works but frustrating",
  feedbackPriorityLow: "Low — minor polish",
  feedbackMessage: "Your feedback",
  feedbackMessagePlaceholder: "Describe what happened, what you expected, or what would help…",
  feedbackSubmit: "Send Feedback",
  feedbackSubmitting: "Sending…",
  feedbackSuccess: "Thank you!",
  feedbackSuccessDetail: "Your feedback has been recorded. We read every submission.",
  feedbackClose: "Close",
  feedbackError: "Could not send — please try again.",

  /* ── Feedback Center (PEP-705) ── */
  fcHelpSupportSection: "Help & Support",
  fcHelpSupportSub: "Feedback, help, and release notes",

  settingsTitle: "Settings",
  settingsLocation: "LOCATION",
  settingsCity: "City",
  settingsCityHint: "Used for Zmanim calculations",
  settingsTimezone: "Timezone",
  settingsAppearance: "APPEARANCE",
  settingsDarkMode: "Dark Mode",
  settingsDarkOn: "Dark mode active",
  settingsDarkOff: "Light mode active",
  settingsShowHebrew: "Show Hebrew Dates",
  settingsLanguage: "Thadou Kuki Language",
  settingsLanguageHint: "Show labels in Thadou Kuki",
  settingsEditTranslations: "✏️ Edit Thadou Kuki Labels",
  settingsEditTranslationsHint: "Fix or improve any translation",
  settingsNotifications: "NOTIFICATIONS",
  settingsCandleLighting: "🕯 Candle Lighting",
  settingsHavdalah: "✨ Havdalah",
  settingsShema: "📖 Latest Shema",
  settingsPrayers: "🕍 Prayer Reminders",
  settingsHolidays: "✡ Holiday Alerts",
  settingsParasha: "📜 Weekly Parasha",
  settingsOmer: "🌾 Omer Counting",
  settingsShabbatDigest: "📋 Shabbat Digest",
  settingsYahrtzeit: "🕯 Yahrtzeit Reminders",
  settingsLeadTime: "Reminder Lead Time",
  settingsLeadTimeHint: "How many minutes before each Zman to alert",
  settingsBgPush: "BACKGROUND PUSH NOTIFICATIONS",
  settingsBgPushDesc: "Receive notifications even when the app is closed or your device is locked. Your current notification preferences above will be sent in the background.",
  settingsBgPushDescUnsupported: "Background push notifications are not supported in this browser.",
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
  settingsSignOut: "Sign Out",
  settingsVersion: "Menashe Calendar",
  settingsNotifBlocked: "Notifications blocked",
  settingsNotifBlockedSub: "Open your browser settings and allow notifications for this site",
  settingsNotifUnsupported: "Not supported in this browser",
  settingsNotifActive: "Active",

  homeToday: "TODAY",
  homeHebrewDate: "HEBREW DATE",
  homeGregorian: "GREGORIAN",
  homeHebrewYear: "Hebrew Year",
  homeZmanim: "ZMANIM",
  homeViewAll: "VIEW ALL »",
  homeSunrise: "SUNRISE",
  homeSunset: "SUNSET",
  homeCandleLighting: "CANDLE LIGHTING",
  homeHavdalahTonight: "HAVDALAH TONIGHT",
  homeShabbatShalom: "Shabbat Shalom",
  homeShabbatInProgress: "Shabbat is in progress",
  homeHavdalahAt: "Havdalah at",
  homeShavuaTov: "Shavua Tov — a wonderful week!",
  homeDailyTorah: "📖 DAILY TORAH THOUGHT",
  homeReadMore: "Read more ↓",
  homeShowLess: "Show less ↑",
  homeShare: "↑ Share",
  homeTodayHoliday: "TODAY'S HOLIDAY",
  homeChagSameach: "Chag Sameach! 🎉",
  homeCommunityTitle: "Community",
  homeCommunityDesc: "Shavei Israel, Torah classes, connect with members",
  homeMembersTitle: "Member Directory",
  homeMembersDesc: "Browse & register in the community directory",
  homeCensusTitle: "Census & Demographics",
  homeCensusDesc: "Fill out the community census form and view statistics",
  homeUpcomingHolidays: "UPCOMING HOLIDAYS",
  homeNoHolidays: "No upcoming holidays",
  homeParashah: "PARASHAH",
  homeDafYomi: "DAF YOMI",
  homeMoreTools: "More Tools",
  annStripNew: "New Announcement",
  celebTitle: "Upcoming Celebrations",
  celebDirLink: "See All →",
  celebTypeBirthday: "Birthday 🎂",
  celebTypeAliyah: "Aliyah Anniversary ✈️",
  celebToday: "Today 🎉",
  celebTomorrow: "Tomorrow",
  celebInDays: "{n}d",
  annStripNews: "{n} New Announcements",
  annStripRead: "Read",
  shabbatBarTitle: "Candle Lighting",
  shabbatBarTrialBadge: "{n} free days left",
  shabbatBarTrialEnd: "Free trial ended",
  shabbatBarUpgradeBtn: "Upgrade 👑",
  shabbatBarTonightLabel: "Tonight!",
  shabbatBarPremiumBadge: "Premium",
  homeOmer: "OMER",
  omerSefiratTitle: "Sefirat HaOmer",
  omerDayCount: "Day {day} of 49",
  omerDaysLeft: "{days} days until Shavuot",
  omerDayLeft: "{days} day until Shavuot",

  fabTitle: "Community Hub",
  fabAnnouncements: "Announcements",
  fabCommunityEvents: "Community Events",
  fabCommunityMemorial: "Community Memorial",
  fabTorahWisdom: "48 Ways to Torah Wisdom",
  fabPrayerBoard: "Prayer Board",
  fabTorahTracker: "Torah Tracker",
  fabLocationMap: "Location Map",
  fabCompass: "Jerusalem Compass",
  compassJerusalem: "Jerusalem",
  compassBearing: "Bearing",
  compassDistKm: "km to Jerusalem",
  compassFromCity: "from",

  txEditorTitle: "Edit Thadou Kuki Labels",
  txEditorSubtitle: "Correct any translation below. Changes are saved on your device.",
  txEditorSave: "Save Changes",
  txEditorSaved: "✓ Saved!",
  txEditorReset: "Reset to Default",
  txEditorResetConfirm: "Reset all Thadou Kuki labels to the built-in defaults?",
  txEditorSearch: "Search labels…",
  txEditorEnglish: "English",
  txEditorThadou: "Thadou Kuki",
  txEditorGroupLanding: "Landing Page",
  txEditorGroupNav: "Navigation",
  txEditorGroupSettings: "Settings",
  txEditorGroupHome: "Home Page",
  txEditorNote: "Tip: Switch the app to Thadou Kuki mode (Settings → Appearance) to see your changes live.",

  roshChodeshLabel: "ROSH CHODESH",
  roshChodeshTodayTitle: "Chodesh Tov! 🌙",
  roshChodeshTodaySub: "Today is Rosh Chodesh {month}",
  roshChodeshTomorrowTitle: "Erev Rosh Chodesh",
  roshChodeshTomorrowSub: "Tomorrow begins Rosh Chodesh {month}",

  shabbatApproaching: "Shabbat begins soon",
  shabbatShalomEn: "Shabbat Shalom",
  shabbatShalomTk: "Shabbat Shalom",
  shabbatCandleLighting: "Candle lighting",
  shabbatHavdalah: "Havdalah",
  shabbatMinutes: "min away",
  shabbatModeActive: "Shabbat is in progress",
  shabbatModeHavdalahIn: "Havdalah in",
  shabbatModeCandleLightingIn: "Candle lighting in",
  shabbatModeShavuaTov: "Shavua Tov — have a wonderful week!",
  shabbatModeDismiss: "Continue in the spirit of Shabbat",

  settingsWhatsNew: "Release Notes",
  settingsWhatsNewSub: "See what changed in this version",

  whatsNewTitle: "What's New",
  whatsNewSubtitle: "Highlights from the latest update",
  whatsNewGotIt: "Got it — let's go!",

  splashTagline: "The Sacred Calendar of Bnei Menashe",

  onboardingStep: "Step {n} of 3",
  onboardingSkip: "Skip",
  onboardingNext: "Next",
  onboardingGetStarted: "Get Started",
  onboardingLangTitle: "Choose Your Language",
  onboardingLangSubtitle: "Select how you'd like to use the app",
  onboardingLocTitle: "Where Are You Located?",
  onboardingLocSubtitle: "Used to calculate accurate prayer times",
  onboardingLocDetect: "📍 Detect My Location",
  onboardingLocDetecting: "Detecting…",
  onboardingLocSelected: "✓ Location set",
  onboardingNotifTitle: "Stay Connected",
  onboardingNotifSubtitle: "Get reminders for Shabbat candle lighting, prayer times, and holidays",
  onboardingNotifEnable: "🔔 Enable Notifications",
  onboardingNotifLater: "Maybe Later",
  onboardingNotifEnabled: "✓ Notifications enabled!",
  onboardingNotifDenied: "Notifications blocked — enable them in browser settings",

  installTitle: "Add to Home Screen",
  installBody: "Install Menashe Calendar for quick access.",
  installBtn: "Install",
  installDismiss: "Not now",

  updateAvailable: "New version available",
  updateRefresh: "Update",
  updateDismiss: "Later",

  profileUploadPhoto: "Upload Photo",
  profileChangePhoto: "Change Photo",
  profileRemovePhoto: "Remove Photo",
  profilePhotoHint: "Tap to upload a profile picture",
  profilePhotoTooBig: "Image too large. Please choose one under 5MB.",

  taharaTitle: "💧 Tahara Calculator",
  taharaSub: "Purity & Mikveh timing",
  taharaPeriodLabel: "Start of period (vesset)",
  taharaCalculate: "Calculate",
  taharaHefsek: "HEFSEK TAHARA",
  taharaMikveh: "MIKVEH NIGHT (EARLIEST)",
  taharaPosekNote: "⚠️ Always consult a qualified posek (halachic authority) for personal guidance.",
  taharaClose: "Close",
  taharaMikvehCalendar: "🌙 My Mikveh Calendar",
  taharaMikvehCalendarSub: "Track & schedule your dates",
  mikvehCalTitle: "🌙 My Mikveh Calendar",
  mikvehCalUpcomingLabel: "upcoming",
  mikvehCalUpcoming: "Upcoming",
  mikvehCalPast: "Past",
  mikvehCalAll: "All",
  mikvehCalEmptyTitle: "No dates yet",
  mikvehCalEmptySub: "Calculate dates in the Tahara Calculator and save them here to track upcoming Mikveh nights.",
  mikvehCalEmptyFilter: "No entries in this category.",
  mikvehCalMikvehNight: "MIKVEH NIGHT",
  mikvehCalHefsek: "HEFSEK TAHARA",
  mikvehCalMikveh: "MIKVEH",
  mikvehCalDone: "✓ Done",
  mikvehCalTonight: "Tonight!",
  mikvehCalIn: "in",
  mikvehCalMarkDone: "✓ Mark Done",
  mikvehCalMarkPending: "↩ Mark Pending",
  mikvehCalDelete: "Delete",
  mikvehCalPrivacy: "Your Mikveh calendar is stored privately on this device only and is never shared or uploaded.",
  mikvehCalSaveBtn: "💾 Save to My Calendar",
  mikvehCalSaved: "✓ Saved to Calendar",
  back: "Back",

  yartzeitTitle: "Yahrzeit Calculator",
  yartzeitSub: "Anniversary of passing",
  yartzeitSavedReminders: "SAVED REMINDERS",
  yartzeitNameLabel: "Name of the departed",
  yartzeitDateLabel: "Date of passing",
  yartzeitTimeLabel: "Time of passing",
  yartzeitTimeUnknown: "Time unknown",
  yartzeitCalculate: "Calculate",
  yartzeitSaveReminder: "Save Reminder",
  yartzeitSaved: "✓ Saved",
  yartzeitAddNew: "Add New",
  yartzeitHalachicNote: "Halachic Note",
  yartzeitClose: "Close",

  dafYomiTitle: "Daf Yomi",
  dafYomiSub: "Daily Talmud Study",
  dafYomiReadSefaria: "Read on Sefaria",
  dafYomiCopied: "Copied to clipboard",
  dafYomiShare: "Share Today's Daf",
  dafYomiLoading: "Loading today's daf…",
  dafYomiError: "Could not load daf. Showing local calculation.",

  holidaysTitle: "Jewish Holidays",
  holidaysCategoryYomTov: "Yom Tov",
  holidaysCategoryFast: "Fast Day",
  holidaysCategoryMinor: "Minor Holiday",
  holidaysCategoryRoshChodesh: "Rosh Chodesh",
  holidaysCategoryModern: "Modern",
  holidaysCategoryShabbat: "Special Shabbat",
  holidaysMussarLesson: "Mussar Lesson",
  holidaysSpiritualTheme: "Spiritual Theme",
  holidaysInsightsSoon: "Detailed insights for this observance are coming soon.",

  prayerBoardTitle: "Prayer Board",
  prayerBoardAdminAccess: "Admin Access",
  prayerBoardAdminPin: "Enter your PIN to moderate the prayer board",
  prayerBoardSubmitTitle: "Submit Prayer Request",
  prayerBoardCategory: "PRAYER TYPE",
  prayerBoardAnonymous: "Submit Anonymously",
  prayerBoardSubmit: "Submit",
  prayerBoardModerate: "Moderate Prayers",
  prayerBoardResponse: "Pastoral response",
  prayerBoardAmen: "Amen",
  prayerBoardPending: "Pending",
  prayerBoardApprove: "Approve",
  prayerBoardRemove: "Remove",

  premiumTitle: "Menashe Premium",
  premiumSubtitle: "Unlock everything",
  premiumSecure: "Secure",
  premiumCancel: "Cancel anytime",
  premiumPayment: "UPI & cards accepted",
  premiumReviewed: "Community reviewed",

  notFoundTitle: "This screen doesn't exist.",
  notFoundHome: "Go to home screen!",

  weekStripTitle: "THIS WEEK",
  weekStripViewCal: "Calendar →",
  weekStripDaySun: "SUN",
  weekStripDayMon: "MON",
  weekStripDayTue: "TUE",
  weekStripDayWed: "WED",
  weekStripDayThu: "THU",
  weekStripDayFri: "FRI",
  weekStripDaySat: "SAT",

  zmanimTimelineTitle: "TODAY AT A GLANCE",
  zmanimTimelineDawn: "Dawn",
  zmanimTimelineSunrise: "Sunrise",
  zmanimTimelineShema: "Shema",
  zmanimTimelineMidday: "Midday",
  zmanimTimelineMincha: "Mincha",
  zmanimTimelineSunset: "Sunset",
  zmanimTimelineNightfall: "Nightfall",
  zmanimTimelineNow: "Now",
  zmanimTimelineTap: "Full Zmanim →",
  nextHolidayTitle: "NEXT HOLIDAY",
  nextHolidayDaysSingle: "day away",
  nextHolidayDaysPlural: "days away",
  nextHolidayToday: "Today!",
  nextHolidayTomorrow: "Tomorrow",
  nextHolidayHide: "Minimise",
  nextHolidayShow: "Next Holiday",
  nextHolidayHalachaTitle: "📖 How to Prepare · Yalkut Yosef",
  nextHolidayHalachaSource: "Source",
  nextHolidayHalachaLoading: "Loading halachot…",
  nextHolidayHalachaError: "Could not load halachot",
  nextHolidayPushTitle: "Holiday Reminder",
  nextHolidayPushBody: "begins tomorrow. Chag Sameach from Bnei Menashe!",
  nextHolidayChecklistProgress: "prepared",
  nextHolidayChecklistReset: "Reset",
  nextHolidayChecklistAllDone: "All steps complete! ✓",
  nextHolidayShareBtn: "Share",
  nextHolidayShareCardTitle: "My Holiday Preparation",
  nextHolidayShareCardBrand: "Bnei Menashe Calendar",
  nextHolidayShareCardProgress: "Preparation Progress",
  nextHolidayShareCardOf: "of",
  nextHolidayShareCardStepsComplete: "steps complete",
  nextHolidayShareCardUnchecked: "Remaining",
  nextHolidayShareAction: "Share",
  nextHolidayShareCopied: "Copied!",
  nextHolidayShareClose: "Close",
  birthdayTrackerTitle: "Hebrew Birthday Tracker",
  birthdayTrackerSub: "Find & save your Jewish birthday",
  birthdayTrackerGregorianLabel: "Date of birth (Gregorian)",
  birthdayTrackerHebrewLabel: "YOUR HEBREW BIRTHDAY",
  birthdayTrackerNextLabel: "NEXT CELEBRATION",
  birthdayTrackerCalculate: "Calculate",
  birthdayTrackerSave: "Save My Birthday",
  birthdayTrackerSaved: "Birthday saved!",
  birthdayTrackerClear: "Clear",
  birthdayTrackerToday: "Today is your Hebrew Birthday! 🎂",
  birthdayTrackerCardTitle: "MY HEBREW BIRTHDAY",
  birthdayTrackerCardDays: "days until birthday",
  birthdayTrackerCardSetup: "Tap to set your Hebrew birthday →",
  modalClose: "Close",
  yartzeitCardTitle: "YAHRZEIT REMINDERS",
  yartzeitCardSetup: "Tap to add a Yahrzeit reminder →",
  yartzeitCardToday: "Today's Yahrzeit",
  yartzeitCardDays: "days away",
  yartzeitCardUpcoming: "UPCOMING YAHRZEIT",
  yartzeitCardManage: "Manage Yahrzeits",
  yartzeitCardObservances: "Today's observances:",
  yartzeitCardObservanceText: "🕯 Light a memorial candle · 🙏 Recite Kaddish · 📖 Study Torah in their memory",
  yartzeitCardDay: "day",
  yartzeitCardPushOff: "Day-of reminder",
  yartzeitCardPushOn: "Reminder set ✓",

  parashaAnnivTitle: "NOTABLE ANNIVERSARIES",
  parashaAnnivYahrzeit: "Yahrzeit",
  parashaAnnivBirthday: "Birthday",
  parashaAnnivEvent: "Historical Event",
  parashaAnnivEmpty: "No anniversaries recorded for this Parasha",
  parashaAnnivExpand: "This week's anniversaries",

  chatTitle: "Rav Menashe AI",
  chatSubtitle: "Your Jewish calendar & Torah companion",
  chatWelcomeTitle: "Shalom! How can I help you?",
  chatWelcomeDesc: "Ask me anything about the Jewish calendar, Torah, prayer times, holidays, or Bnei Menashe traditions.",
  chatPlaceholder: "Ask about Shabbat, Zmanim, Torah…",
  chatDisclaimer: "For practical halachic decisions, consult your rabbi.",
  chatError: "Sorry, I couldn't respond. Please try again.",
  chatFabLabel: "Ask Rabbi AI",
  chatVoiceStart: "Tap to speak",
  chatVoiceStop: "Listening… tap to stop",
  chatVoiceUnsupported: "Voice not supported in this browser",
  chatShare: "Share",
  chatCopied: "Copied!",
  chatSuggestLabel: "Ask more",
  chatSuggestedQuestions: [
    "What is today's Parasha about?",
    "When is Shabbat this week?",
    "Explain Mussar and character refinement",
    "What is Daf Yomi?",
    "Tell me about the Bnei Menashe community",
    "What are the Zmanim for prayer?",
  ],

  /* ── Memorial Sanctuary ── */
  memTitle: "COMMUNITY MEMORIAL",
  memSubtitle: "A Valley of Remembrance & Love",
  memEnteringSanctuary: "Entering the Sanctuary",
  memLoadingScene: "Loading 3D scene…",
  memInitializingWebGL: "Initializing WebGL…",
  memBuildingValley: "Building the valley…",
  memPlacingMemorials: "Placing memorials…",
  memLightingCandles: "Lighting the candles…",
  memAlmostReady: "Almost ready…",
  memSearchPlaceholder: "Search for a loved one...",
  memGoldenHour: "Golden Hour",
  memCandlesLit: "Candles Lit",
  memInLovingMemory: "In Loving Memory",
  memNavHome: "Home",
  memNavMemorials: "Memorials",
  memHintDrag: "Drag to pan",
  memHintPinch: "Pinch to zoom",
  memHintTap: "Tap to light candle",
  memLightCandle: "Light a Candle",
  memLightCandleSub: "Honor a loved one in the sanctuary",
  memFullName: "FULL NAME",
  memFullNamePlaceholder: "Name of the departed",
  memHebrewName: "HEBREW NAME",
  memDateOfPassing: "DATE OF PASSING",
  memMemorialMessage: "MEMORIAL MESSAGE",
  memMessagePlaceholder: "Share a memory or blessing...",
  memLightingCandle: "Lighting candle…",
  memLightTheCandle: "Light the Candle",
  memCandleLit: "Candle Lit",
  memMemoryBlessing: "May their memory be a blessing",
  memDedicatedLearning: "DEDICATED LEARNING",
  memLeaveTribute: "Leave a Tribute",
  memYourName: "YOUR NAME",
  memStudySubject: "SUBJECT OF STUDY",
  memSubmitting: "Submitting…",
  memDedicate: "Dedicate",
  memTributeRecorded: "Tribute recorded — may it be for a blessing",
  memNoResults: "No memorials found",
  memClearSearch: "Clear search",
  memCandlesCount: "candles",
  memLitBy: "LIT BY",
  memPlaceFlower: "Place a Flower",
  memFlowersBtn: "Flowers",
  memChooseFlowerColor: "Choose a colour",
  memPlaceFlowerBtn: "Place Flower",
  memFlowersInGarden: "flowers in the garden",
  /* ── Memorial Shell (SPR-015) ── */
  memShellWelcome: "Memorial Sanctuary",
  memShellWelcomeSub: "A sacred space to honor and remember loved ones of the Bnei Menashe community",
  memShellFeatured: "Featured Memorials",
  memShellRecentCandles: "Recently Lit Candles",
  memShellFamilyMemorials: "Family Memorials",
  memShellCreate: "Create a Memorial",
  memShellCreateSub: "Honor a loved one in the community sanctuary",
  memShellEnter3D: "Enter 3D Sanctuary",
  memShellEnter3DSub: "Experience the immersive Memorial Valley",
  memShellResults: "Search Results",
  memShellViewAll: "View all",
  memShellLoadMore: "Load more",
  memShellLoading: "Searching…",
  memShellEmptySearch: "No results for",
  memShellSearchError: "Search failed",
  memShellRetry: "Try again",
  memShellFeaturedEmpty: "Featured memorials coming soon",
  memShellFeaturedEmptySub: "Be the first to create a memorial in the sanctuary",
  memShellRecentEmpty: "No candles lit recently",
  memShellRecentEmptySub: "Light a candle on any memorial to honor a loved one",
  memShellFamilyEmpty: "No family memorials yet",
  memShellFamilyEmptySub: "Create a memorial to remember a loved one",
  memShellOffline: "You are offline",
  memShellOfflineSub: "Connect to the internet to browse memorials",
  memProfileBorn: "Born",
  memProfileDied: "Passed",
  memProfileAge: "Age",
  memProfileYears: "years",
  memProfileBiography: "Biography",
  memProfileRecentTributes: "Tributes",
  memProfileRecentCandles: "Candles",
  memProfileUpcomingYahrzeit: "Upcoming Yahrzeit",
  memProfileFamilySection: "Family",
  memProfileLocationSection: "Location",
  memProfileActionLight: "Light Candle",
  memProfileActionTribute: "Leave Tribute",
  memProfileActionPhotos: "Photos",
  memProfileActionShare: "Share",
  memProfileCopied: "Copied!",
  memProfilePrivateBadge: "Private",
  memProfileFamilyBadge: "Family",
  memProfileCommunityBadge: "Community",
  memProfilePublicBadge: "Public",
  memProfileNotFound: "Memorial Not Found",
  memProfileNotFoundSub: "This memorial may have been removed or the link is incorrect.",
  memProfilePrivate: "Private Memorial",
  memProfilePrivateSub: "Only family members can view this memorial.",
  memProfileNoBio: "No biography on record.",
  memProfileNoTributes: "No tributes yet. Be the first to leave one.",
  memProfileNoCandles: "No candles lit yet.",
  memProfileNoFamily: "Family information not available.",
  memProfileNoYahrzeit: "Yahrzeit date unavailable.",
  memProfileNoLocation: "Location not recorded.",
  memProfileYahrzeitNext: "Next yahrzeit:",
  memProfileYahrzeitToday: "Today is the yahrzeit",
  memProfileDaysAway: "days",
  memCandleTabRecent: "Recent",
  memCandleTabToday: "Today",
  memCandleTabCommunity: "Community",
  memCandleRelationship: "Relationship",
  memCandleCommunityField: "Community / Congregation",
  memCandleRelationshipPlaceholder: "e.g. Son, Daughter, Friend",
  memTributeTypeLabel: "Type",
  memTributeTypeAll: "All",
  memTributeTypeMemory: "Memory",
  memTributeTypePrayer: "Prayer",
  memTributeTypeScripture: "Scripture",
  memTributeTypeFamily: "Family",
  memTributeCommunityType: "Community",
  memFamilyManage: "Manage Family",
  memFamilyInvite: "Invite Member",
  memFamilyUserId: "User ID",
  memFamilySelectRole: "Select role",
  memFamilyRoleAdmin: "Admin",
  memFamilyRoleMember: "Member",
  memFamilyRoleViewer: "Viewer",
  memFamilyRemove: "Remove",
  memFamilyTransfer: "Transfer ownership",
  memFamilyInviting: "Inviting…",
  memFamilyInvited: "Member invited",
  memFamilyNoMembers: "No family members yet",
  memFamilyPrimaryContact: "Primary contact",
  memYahrzeitAlertToday: "Today is the Yahrzeit",
  memYahrzeitAlertSoon: "Yahrzeit in",
  memYahrzeitSuggestPrayer: "Say Kaddish",
  memYahrzeitSuggestPsalm: "Psalm 23 — Mizmor LeDavid",
  memYahrzeitSuggestCandle: "Light a Yahrzeit Candle",
  memColRecentlyRemembered: "Recently Remembered",
  memColMostVisited: "Most Visited",
  memColRecentlyLit: "Recently Lit",
  memColUpcomingYahrzeit: "Upcoming Yahrzeit",
  memColCommunityPicks: "Community Picks",
  memLoadMore: "Load more",
  /* ── Memorial Sanctuary SPR-035 ── */
  memNavFlowers: "Flowers",
  memNavMessages: "Messages",
  memNavMusic: "Music",
  memSceneValley: "Valley",
  memSceneGarden: "Garden",
  memSceneWaterfall: "Waterfall",
  memSceneSanctuary: "Sanctuary",
  memSceneSunset: "Sunset",
  memAmbientOn: "Ambient on",
  memAmbientOff: "Ambient off",
  memNoRecentActivity: "No recent activity yet.",
  memTodayRemembrance: "TODAY'S REMEMBRANCE",
  memLightFirstCandle: "Light the first candle",
  memSceneLoadError: "3D scene could not be loaded",
  memTimelineTitle: "LIFE TIMELINE",
  memTimelineJourney: "Life's Journey",
  memTimelineRemembered: "Remembered",
  memWalkEntrance: "Entrance",
  memWalkOverview: "Overview",
  memWalkMode: "Walk",

  /* ── Journey Page ── */
  navJourney: "Journey",
  journeyTitle: "My Journey",
  journeySubtitle: "Your personal sacred path",
  journeyEditProfile: "Edit Profile",
  journeyMemberSince: "Member since",
  journeyStreak: "Study Streak",
  journeyCandles: "Candles Lit",
  journeyAchievements: "Achievements",
  journeyBadgesEarned: "badges earned",
  journeyActivity: "Recent Activity",
  journeySaved: "Saved Content",
  journeyGoals: "My Goals",
  journeyAccount: "Account",
  journeySettings: "Settings",
  journeyPremium: "Premium",
  journeyHelp: "Help & Feedback",
  journeySignOut: "Sign Out",
  journeyNoActivity: "No activity yet — start your journey!",
  journeyStudySession: "Study session",
  journeyTorahGoal: "Weekly Torah Goal",
  journeyWeeklyProgress: "Progress this week",
  journeyBookmarks: "Siddur Bookmarks",
  journeyOpenSiddur: "Open Siddur",
  journeyPersonal: "Personal Reminders",
  journeyNotSignedIn: "Sign in to see your personal journey",

  /* ── Notifications Page ── */
  notifPageTitle: "Notifications",
  notifMarkAllRead: "Mark All Read",
  notifTabAll: "All",
  notifTabTorah: "Torah",
  notifTabPrayer: "Prayer",
  notifTabHolidays: "Holidays",
  notifTabCommunity: "Community",
  notifTabAccount: "Account",
  notifEmptyCta: "Continue Learning",
  notifActivityTitle: "Activity",
  notifQuickActions: "Quick Actions",
  notifResumeStudy: "Resume Torah Study",
  notifPrayerTimes: "Prayer Times",
  notifOpenYahrzeit: "Yahrzeit",
  notifOpenCommunity: "Community",
  notifSettingsTitle: "Notification Settings",
  notifPrayerReminders: "Daily Prayers",
  notifPrayerRemindersSub: "Shacharit, Mincha & Maariv",
  notifShabbatCandles: "Shabbat Candle Lighting",
  notifShabbatCandlesSub: "18 min before candles",
  notifHavdalahReminder: "Havdalah",
  notifShemaReminder: "Latest Shema",
  notifShemaReminderSub: "Deadline alert",
  notifTorahReminders: "Weekly Parasha",
  notifTorahRemindersSub: "Friday morning reminder",
  notifHolidayReminders: "Holiday Alerts",
  notifHolidayRemindersSub: "Day before each holiday",
  notifYahrzeitReminders: "Yahrzeit Reminders",
  notifOmerCount: "Omer Count",
  notifShabbatDigest: "Shabbat Digest",
  notifShabbatDigestSub: "Weekly summary on Friday",
  notifLeadTime: "Reminder Lead Time",
  notifPushNotifications: "Push Notifications",
  notifPushSubscribe: "Enable Push",
  notifPushUnsubscribe: "Disable Push",
  notifPushTest: "Send Test Notification",
  notifPermissionDenied: "Notifications are blocked in your browser. Open browser settings to enable them.",
  notifRetry: "Try Again",
  notifNoActivity: "No activity yet — start your learning journey!",
  notifStartStudy: "Start logging Torah study →",
  notifFilterUnread: "Unread",
  notifFilterRead: "Read",
  notifAllCaughtUp: "You're all caught up",
  notifAllCaughtUpSub: "No new notifications right now.",
  notifQuietHours: "Quiet Hours",
  notifQuietHoursDesc: "Silence all alerts during these hours",
  notifQuietFrom: "From",
  notifQuietTo: "To",
  notifPushActive: "Push alerts are active",
  notifPushInactive: "Get alerts even when the app is closed",
  notifSignInMsg: "Sign in to see your personalised alerts and activity.",
  notifErrorTitle: "Something went wrong",
  notifErrorSub: "We couldn't load your notifications.",
  notifUnread: "unread",
  notifBack: "Back",

  remembranceTitle: "Remembrance Center",
  remembranceSubtitle: "Keep the names, dates, and stories of your family close.",
  remembranceAdd: "Add remembrance",
  remembranceUpcoming: "Coming up",
  remembranceYahrzeits: "Yahrzeits",
  remembranceBirthdays: "Birthdays",
  remembranceAnniversaries: "Anniversaries",
  remembranceEvents: "Family remembrance",
  remembranceNoEvents: "Your remembrance space is ready",
  remembranceNoEventsSub: "Add a yahrzeit, birthday, or anniversary to begin.",
  remembranceLoading: "Loading your remembrance space",
  remembranceLoadError: "We couldn't load your remembrance events.",
  remembranceRetry: "Try again",
  remembranceToday: "Today",
  remembranceTomorrow: "Tomorrow",
  remembranceInDays: "In {n} days",
  remembranceYahrzeit: "Yahrzeit",
  remembranceBirthday: "Birthday",
  remembranceAnniversary: "Anniversary",
  remembranceNewEvent: "New remembrance",
  remembranceEditEvent: "Edit remembrance",
  remembranceDetails: "Remembrance details",
  remembranceName: "Name",
  remembranceRelationship: "Relationship",
  remembranceEventType: "Event type",
  remembranceDate: "Date",
  remembranceMonth: "Month",
  remembranceYear: "Year",
  remembranceDayLabel: "Day",
  remembranceHebrewDate: "Hebrew date",
  remembranceGregorianDate: "Gregorian date",
  remembranceUseHebrewDate: "Use Hebrew date",
  remembranceBeforeSunset: "Date observed before sunset",
  remembranceRepeatAnnually: "Repeat every year",
  remembranceLocation: "Place",
  remembranceNotes: "Notes",
  remembranceNotesPlaceholder: "A memory, blessing, or family detail",
  remembranceNotifications: "Notifications",
  remembranceEnableNotifications: "Remind me about this date",
  remembranceDaysBefore: "Days before",
  remembranceNotificationTime: "Notification time",
  remembranceCensusLink: "Link to a Census person",
  remembranceCensusNone: "No person linked",
  remembranceCensusLoading: "Finding family people",
  remembranceCensusUnavailable: "Census linking is not available right now.",
  remembranceSave: "Save remembrance",
  remembranceCancel: "Cancel",
  remembranceDelete: "Delete",
  remembranceDeleteConfirm: "Delete this remembrance?",
  remembranceDeleteBody: "This family remembrance will be removed from your calendar.",
  remembranceConfirmDelete: "Delete remembrance",
  remembranceShare: "Share",
  remembranceCopied: "Remembrance details copied.",
  remembranceShareFailed: "Sharing is not available on this device.",
  remembranceClose: "Close",
  remembranceRequired: "Please enter a name and date.",
  remembranceSaved: "Remembrance saved",
  remembranceDays: "days",
  remembranceDay: "day",
  remembranceNoDate: "Date not set",
  remembranceAddYahrzeit: "Add Yahrzeit",
  remembranceAddBirthday: "Add Birthday",
  remembranceAddAnniversary: "Add Anniversary",
  remembranceShareFamilyCalendar: "Share Family Calendar",
  remembrance20YearSchedule: "Upcoming 20-Year Schedule",
  remembranceExportICS: "Export to Calendar (.ics)",
  remembranceICSDownloaded: "Family calendar downloaded",
  remembranceNoYahrzeits: "No Yahrzeits yet",
  remembranceNoBirthdays: "No Birthdays yet",
  remembranceNoAnniversaries: "No Anniversaries yet",
};

/* ──────────────────────────────────────────────────────────────
   THADOU KUKI  (community can correct via the in-app editor)
────────────────────────────────────────────────────────────── */
export const tk: Translations = {
  landingBadge: "BNEI MENASHE",
  landingHero: "Bnei Menashe Gil\nNi Thu Leh Thla",
  landingSubtitle: "Zmanim chiang tak, Torah thu, ni thianghlim leh mipil thupek — inn khat ah phung.",
  landingSignIn: "Lut Ta",
  landingFree: "Mipil tan belin · Account hau lo",
  landingScroll: "SENG",
  landingFeaturesEyebrow: "NA HAUT ZAWNG",
  landingFeaturesHeading: "Na thu neksang\nsanggam khat",
  landingFeaturesSubHeading: "Na thu neksang sanggam khat",
  featureZmanimTitle: "Zmanim Chiang Tak",
  featureZmanimDesc: "Zingkha thu dawt, Mincha, Maariv leh Shabbat katni — na hmun chiangin phuah.",
  featureTorahTitle: "Torah Thu",
  featureTorahDesc: "Parashah thupek, Daf Yomi, Siddur leh Torah thu — ni tin khawl theih.",
  featureCommunityTitle: "Mipil Inn",
  featureCommunityDesc: "Thupek, lawmman, Yahrtzeit leh Bnei Menashe mipil thupek zawng zawng.",
  statsParashot: "Thupek Parashot",
  statsHolidays: "Ni Thianghlim",
  statsCommunities: "Mipil Innkuan",
  ctaHeading: "Na lamka phun ta",
  ctaSubtitle: "Bnei Menashe mipil tan bel a — mipil zawng zawng tan.",

  navHome: "Inn",
  navCalendar: "Ni Thu",
  navZmanim: "Zmanim",
  navSiddur: "Thu Ziak",
  navSettings: "Siam Dan",
  navChat: "Chat",
  navNotifications: "Hlabu Thar",
  libraryBrowseCategories: "Thlang dan tawh",

  /* ── Beta Feedback ── */
  feedbackButtonLabel: "Thu Pe",
  feedbackTitle: "Thu Pe Rawh",
  feedbackSubtitle: "Pawlpi tengin platform siamthat ding in hong pui rawh.",
  feedbackCategory: "Thlang Dan",
  feedbackCategoryBug: "Bug",
  feedbackCategoryUx: "A Thiam Lo",
  feedbackCategoryContent: "Thu Om Lo",
  feedbackCategoryPerf: "A Liam Tlai",
  feedbackCategorySuggest: "Thu Sawl",
  feedbackPriority: "A Tha Lo Zat?",
  feedbackPriorityCritical: "A Tha Lohna Ber — App hmang theilo",
  feedbackPriorityHigh: "A Sang Ber — Feature a dong lo",
  feedbackPriorityMedium: "Lakhawm — a bawl thei nain a phur",
  feedbackPriorityLow: "Hniam — siamthat tur hniam",
  feedbackMessage: "Na thu",
  feedbackMessagePlaceholder: "Thil om dan, om tur leh pui tur gen rawh…",
  feedbackSubmit: "Thu Thawn",
  feedbackSubmitting: "A thawn mek…",
  feedbackSuccess: "Lawm e!",
  feedbackSuccessDetail: "Na thu a ziak ta. Ziak tawh zawng zawng kan en ang.",
  feedbackClose: "Kawr",
  feedbackError: "A thawn theilo — zawk tih rawh.",

  /* ── Feedback Center (PEP-705) ── */
  fcHelpSupportSection: "Pui Leh Enkawl",
  fcHelpSupportSub: "Thu pe, pui leh thar ziak dan",

  settingsTitle: "Siam Dan",
  settingsLocation: "HMUN",
  settingsCity: "Khua",
  settingsCityHint: "Zmanim thlen tan hmang",
  settingsTimezone: "Ni Sung Dan",
  settingsAppearance: "SIM BUATSAIH",
  settingsDarkMode: "Zim Bel",
  settingsDarkOn: "Zim bel a khang mek",
  settingsDarkOff: "Lim bel a khang mek",
  settingsShowHebrew: "Hebrew Ni Thu En",
  settingsLanguage: "Thadou Kuki Thu",
  settingsLanguageHint: "Thadou Kuki thuin sim",
  settingsEditTranslations: "✏️ Thadou Kuki Label Siam",
  settingsEditTranslationsHint: "Label dang tak siam theih",
  settingsNotifications: "THUPEK HLA",
  settingsCandleLighting: "🕯 Katni Mei",
  settingsHavdalah: "✨ Havdalah",
  settingsShema: "📖 Shema Hnung Ber",
  settingsPrayers: "🕍 Thu Dawt Hla",
  settingsHolidays: "✡ Ni Thianghlim Hla",
  settingsParasha: "📜 Parashah Thupek",
  settingsOmer: "🌾 Omer Chhiar",
  settingsShabbatDigest: "📋 Shabbat Sawi",
  settingsYahrtzeit: "🕯 Yahrtzeit Hla",
  settingsLeadTime: "Hla Dan Thlawhna",
  settingsLeadTimeHint: "Zman hma chuan minit engzat ngai",
  settingsBgPush: "THLEN CHHAH HLABU",
  settingsBgPushDesc: "App a tawp ngin emaw device a lock ngemin hlabu dawng theih. Hla dan na siam ang in thlen a ni.",
  settingsBgPushDescUnsupported: "Hei browser hian chhah hlabu a support lo.",
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
  settingsSignOut: "Tawp Ta",
  settingsVersion: "Menashe Ni Thu",
  settingsNotifBlocked: "Hlabu a block",
  settingsNotifBlockedSub: "Browser siam dan chu thlak la, hlabu dawng theihna pe rawh",
  settingsNotifUnsupported: "Hei browser hian a support lo",
  settingsNotifActive: "A on mek",

  homeToday: "NIZAN",
  homeHebrewDate: "HEBREW NI",
  homeGregorian: "GREGORIAN",
  homeHebrewYear: "Hebrew Kum",
  homeZmanim: "ZMANIM",
  homeViewAll: "ZAWNG EN »",
  homeSunrise: "NI CHHUAK",
  homeSunset: "NI TLAI",
  homeCandleLighting: "KATNI MEI",
  homeHavdalahTonight: "ZAN HAVDALAH",
  homeShabbatShalom: "Shabbat Shalom",
  homeShabbatInProgress: "Shabbat a lo mek",
  homeHavdalahAt: "Havdalah ni a",
  homeShavuaTov: "Shavua Tov — Zarhnawk thar!",
  homeDailyTorah: "📖 NIZAN TORAH THU",
  homeReadMore: "Ziak zawk ↓",
  homeShowLess: "Zawk lo ↑",
  homeShare: "↑ Sawi Chhuak",
  homeTodayHoliday: "NIZAN NI THIANGHLIM",
  homeChagSameach: "Chag Sameach! 🎉",
  homeCommunityTitle: "Mipil",
  homeCommunityDesc: "Shavei Israel, Torah class, member te nen in inhmuh",
  homeMembersTitle: "Member Directory",
  homeMembersDesc: "Mipil directory-ah register la member te en",
  homeCensusTitle: "Mipil Chhiar",
  homeCensusDesc: "Mipil census form thlak la statistics en",
  homeUpcomingHolidays: "NI THIANGHLIM HLA",
  homeNoHolidays: "Ni thianghlim hla awm lo",
  homeParashah: "PARASHAH",
  homeDafYomi: "DAF YOMI",
  homeMoreTools: "Thil Pawimawh Zawk",
  annStripNew: "Thu Thar Dawng",
  celebTitle: "Ni Lawmawm Hla",
  celebDirLink: "Zawng Ta →",
  celebTypeBirthday: "Nirualna 🎂",
  celebTypeAliyah: "Aliyah Ni Thleng ✈️",
  celebToday: "Nihin 🎉",
  celebTomorrow: "Zanthla",
  celebInDays: "{n}ni",
  annStripNews: "Thu Thar {n} Dawng",
  annStripRead: "Chhiar",
  shabbatBarTitle: "Kerhi Hun",
  shabbatBarTrialBadge: "Ni {n} theih leh",
  shabbatBarTrialEnd: "Theih hun zo tawh",
  shabbatBarUpgradeBtn: "Nei Ta 👑",
  shabbatBarTonightLabel: "Zanin!",
  shabbatBarPremiumBadge: "Premium",
  homeOmer: "OMER",
  omerSefiratTitle: "Sefirat HaOmer",
  omerDayCount: "{day} ni a ni, 49 chhung",
  omerDaysLeft: "Shavuot hma {days} ni",
  omerDayLeft: "Shavuot hma {days} ni",

  fabTitle: "Mipil Inn",
  fabAnnouncements: "Thupek",
  fabCommunityEvents: "Mipil Lawmman",
  fabCommunityMemorial: "Mipil Thi Ni",
  memLoadingScene: "3D Scene lo in…",
  memInitializingWebGL: "WebGL pek in…",
  memBuildingValley: "Valley lak in…",
  memPlacingMemorials: "Memorial pek in…",
  memLightingCandles: "Theilawk lak in…",
  memAlmostReady: "A hnai tawh…",
  fabTorahWisdom: "Torah Thu 48 Dan",
  fabPrayerBoard: "Thu Dawt Hmang",
  fabTorahTracker: "Torah Chhiar",
  fabLocationMap: "Hmun Kolam",
  fabCompass: "Yerusalem Compass",
  compassJerusalem: "Yerusalem",
  compassBearing: "Bearing",
  compassDistKm: "km Yerusalem tan",
  compassFromCity: "atangin",

  txEditorTitle: "Thadou Kuki Label Siam",
  txEditorSubtitle: "Label dang tak chu hnuaiah siam rawh. Na device-ah chhuang a ni.",
  txEditorSave: "Chhuang Ta",
  txEditorSaved: "✓ Chhuangin zo!",
  txEditorReset: "Default Ah Chhawn",
  txEditorResetConfirm: "Thadou Kuki label zawng zawng default-ah chhawn ang em?",
  txEditorSearch: "Label zawng…",
  txEditorEnglish: "English",
  txEditorThadou: "Thadou Kuki",
  txEditorGroupLanding: "Landing Page",
  txEditorGroupNav: "Lampi (Nav)",
  txEditorGroupSettings: "Siam Dan",
  txEditorGroupHome: "Inn Page",
  txEditorNote: "Tip: Thadou Kuki mode on siam la (Siam Dan → SIM BUATSAIH) nakin na siam zawng en theih.",

  roshChodeshLabel: "ROSH CHODESH",
  roshChodeshTodayTitle: "Chodesh Tov! 🌙",
  roshChodeshTodaySub: "Ni thar chu Rosh Chodesh {month}",
  roshChodeshTomorrowTitle: "Erev Rosh Chodesh",
  roshChodeshTomorrowSub: "Ni thar {month} chu thleng dawn",

  shabbatApproaching: "Shabbat a thleng a tlem",
  shabbatShalomEn: "Shabbat Shalom",
  shabbatShalomTk: "Shabbat Shalom — Ni Thianghlim",
  shabbatCandleLighting: "Kerhi hun",
  shabbatHavdalah: "Havdalah",
  shabbatMinutes: "min chhung",
  shabbatModeActive: "Ni Thianghlim a lo thleng ta",
  shabbatModeHavdalahIn: "Havdalah chhung",
  shabbatModeCandleLightingIn: "Kerhi hun chhung",
  shabbatModeShavuaTov: "Shavua Tov — Ni tha zawng hriat se!",
  shabbatModeDismiss: "Shabbat nun-zia chu pawm rawh",

  settingsWhatsNew: "Release Notes",
  settingsWhatsNewSub: "Version thar-ah thil thar zawng en",

  whatsNewTitle: "Thar Zawng Zawng",
  whatsNewSubtitle: "Update thar ber-ah thil thar zawng",
  whatsNewGotIt: "A lo — kal ang!",

  splashTagline: "Bnei Menashe Gil Ni Thu Leh Thla",

  onboardingStep: "Lehkha {n} / 3",
  onboardingSkip: "Kal Ta",
  onboardingNext: "Hla Ta",
  onboardingGetStarted: "Tan Ta",
  onboardingLangTitle: "Thu Dang Thlang",
  onboardingLangSubtitle: "App ah thuzia zawng thlang rawh",
  onboardingLocTitle: "Na Hmun Engzat?",
  onboardingLocSubtitle: "Zmanim chiang tak phuah tan hmang",
  onboardingLocDetect: "📍 Na Hmun En Ta",
  onboardingLocDetecting: "A en mek…",
  onboardingLocSelected: "✓ Hmun siam zo",
  onboardingNotifTitle: "Inhmuh Zel",
  onboardingNotifSubtitle: "Shabbat mei, thu dawt hun leh ni thianghlim hlabu dawng rawh",
  onboardingNotifEnable: "🔔 Hlabu On Siam",
  onboardingNotifLater: "Hun Dang Ah",
  onboardingNotifEnabled: "✓ Hlabu a on mek!",
  onboardingNotifDenied: "Hlabu a block — browser siam dan-ah on siam rawh",

  installTitle: "Home Screen-ah Chhuang",
  installBody: "Menashe Calendar install siam la a hun zel.",
  installBtn: "Install",
  installDismiss: "Hun dang ah",

  updateAvailable: "Version thar a awm",
  updateRefresh: "Update siam",
  updateDismiss: "Hun dang ah",

  profileUploadPhoto: "Photo Upload Siam",
  profileChangePhoto: "Photo Hlovar",
  profileRemovePhoto: "Photo Hawn",
  profilePhotoHint: "Profile picture upload nan dap la",
  profilePhotoTooBig: "Image a lian em em. 5MB hnuaiah mi la siam rawh.",

  taharaTitle: "💧 Tahara Chhiar",
  taharaSub: "Ropui leh Mikveh hun",
  taharaPeriodLabel: "Vesset tan ni",
  taharaCalculate: "Chhiar Ta",
  taharaHefsek: "HEFSEK TAHARA",
  taharaMikveh: "MIKVEH ZAN (HMASAWN BER)",
  taharaPosekNote: "⚠️ Posek (dinna thu neih) nen inpawl rawh.",
  taharaClose: "Tawp Ta",
  taharaMikvehCalendar: "🌙 Ka Mikveh Calendar",
  taharaMikvehCalendarSub: "I ni leh hun zirchian ta",
  mikvehCalTitle: "🌙 Ka Mikveh Calendar",
  mikvehCalUpcomingLabel: "la inpek",
  mikvehCalUpcoming: "La Inpek",
  mikvehCalPast: "Thleng Zo",
  mikvehCalAll: "Tất cả",
  mikvehCalEmptyTitle: "Ni pawimawh neilo",
  mikvehCalEmptySub: "Tahara Calculator-ah ni chhiar la, Mikveh ni zirchian nan khi chhuah rawh.",
  mikvehCalEmptyFilter: "Hi phum-ah entry awm lo.",
  mikvehCalMikvehNight: "MIKVEH ZAN",
  mikvehCalHefsek: "HEFSEK TAHARA",
  mikvehCalMikveh: "MIKVEH",
  mikvehCalDone: "✓ Thleng Zo",
  mikvehCalTonight: "Zan dang hi!",
  mikvehCalIn: "in",
  mikvehCalMarkDone: "✓ Thleng Zo Tih",
  mikvehCalMarkPending: "↩ La Inpek Tih",
  mikvehCalDelete: "Hawn",
  mikvehCalPrivacy: "I Mikveh calendar hi i device-ah chauh chhuang a ni a, share leh upload a ni lo.",
  mikvehCalSaveBtn: "💾 Calendar-ah Chhuang",
  mikvehCalSaved: "✓ Calendar-ah Chhuang Zo",
  back: "Chho",

  yartzeitTitle: "Yahrzeit Chhiar",
  yartzeitSub: "Thi ni chhiar",
  yartzeitSavedReminders: "CHHUANG ZO HLABU",
  yartzeitNameLabel: "Thi mi hming",
  yartzeitDateLabel: "Thi ni",
  yartzeitTimeLabel: "Thi hun",
  yartzeitTimeUnknown: "Hun hre lo",
  yartzeitCalculate: "Chhiar Ta",
  yartzeitSaveReminder: "Hlabu Chhuang",
  yartzeitSaved: "✓ Chhuangin zo",
  yartzeitAddNew: "Thar Chhuang",
  yartzeitHalachicNote: "Dinna Thu",
  yartzeitClose: "Tawp Ta",

  dafYomiTitle: "Daf Yomi",
  dafYomiSub: "Ni Tin Talmud Ziak",
  dafYomiReadSefaria: "Sefaria-ah Chhiar",
  dafYomiCopied: "Clipboard-ah chhuang zo",
  dafYomiShare: "Nizan Daf Sawi Chhuak",
  dafYomiLoading: "Nizan daf lo mek…",
  dafYomiError: "Daf load theih lo. Chhiar dan hrang hmang.",

  holidaysTitle: "Ni Thianghlim",
  holidaysCategoryYomTov: "Yom Tov",
  holidaysCategoryFast: "Ni Tawh",
  holidaysCategoryMinor: "Ni Thianghlim Hmelhriat",
  holidaysCategoryRoshChodesh: "Rosh Chodesh",
  holidaysCategoryModern: "Modern",
  holidaysCategoryShabbat: "Shabbat Hlawhtling",
  holidaysMussarLesson: "Mussar Thu",
  holidaysSpiritualTheme: "Thianghlim Thu",
  holidaysInsightsSoon: "Ni thianghlim hian thu zawng a lo dawn.",

  prayerBoardTitle: "Thu Dawt Hmang",
  prayerBoardAdminAccess: "Admin Lut Dan",
  prayerBoardAdminPin: "Thu dawt hmang moderate tan PIN dil rawh",
  prayerBoardSubmitTitle: "Thu Dawt Thawn",
  prayerBoardCategory: "THU DAWT DAN",
  prayerBoardAnonymous: "Hming Nei Lo Ber Thawn",
  prayerBoardSubmit: "Thawn Ta",
  prayerBoardModerate: "Thu Dawt Moderate",
  prayerBoardResponse: "Pastoral response",
  prayerBoardAmen: "Amen",
  prayerBoardPending: "A lo mek",
  prayerBoardApprove: "Pawm Ta",
  prayerBoardRemove: "Thlak Ta",

  premiumTitle: "Menashe Premium",
  premiumSubtitle: "Zawng zawng en theih",
  premiumSecure: "Thlen tak",
  premiumCancel: "Hun dang ah tawp theih",
  premiumPayment: "UPI & card dawng",
  premiumReviewed: "Mipil enkawl",

  notFoundTitle: "Screen hei awm lo.",
  notFoundHome: "Inn screen-ah kal rawh!",

  weekStripTitle: "THAWHNI",
  weekStripViewCal: "Kolam en →",
  weekStripDaySun: "NI",
  weekStripDayMon: "LUN",
  weekStripDayTue: "ZAN",
  weekStripDayWed: "ARB",
  weekStripDayThu: "BRES",
  weekStripDayFri: "PAR",
  weekStripDaySat: "ZAT",

  zmanimTimelineTitle: "NI ZMANIM TIMELINE",
  zmanimTimelineDawn: "Alah",
  zmanimTimelineSunrise: "Ni Leh",
  zmanimTimelineShema: "Shema",
  zmanimTimelineMidday: "Nitang",
  zmanimTimelineMincha: "Mincha",
  zmanimTimelineSunset: "Ni Tum",
  zmanimTimelineNightfall: "Zanin",
  zmanimTimelineNow: "Ni Tawp",
  zmanimTimelineTap: "Zmanim en →",
  nextHolidayTitle: "NISA THIAMNA",
  nextHolidayDaysSingle: "ni en",
  nextHolidayDaysPlural: "ni en",
  nextHolidayToday: "Ni Tawp!",
  nextHolidayTomorrow: "Tuni",
  nextHolidayHide: "Paih",
  nextHolidayShow: "Nisa Thiamna",
  nextHolidayHalachaTitle: "📖 Zang Dinga · Yalkut Yosef",
  nextHolidayHalachaSource: "Chun",
  nextHolidayHalachaLoading: "Halachot lak in…",
  nextHolidayHalachaError: "Halachot lak theih nahi",
  nextHolidayPushTitle: "Nisa Suangkhol",
  nextHolidayPushBody: "tuni khata suak. Chag Sameach Bnei Menashe sung!",
  nextHolidayChecklistProgress: "bawl",
  nextHolidayChecklistReset: "Reset",
  nextHolidayChecklistAllDone: "Tangkhul dawn! ✓",
  nextHolidayShareBtn: "Sawi Chhuak",
  nextHolidayShareCardTitle: "Ka Nisa Zang Dinga",
  nextHolidayShareCardBrand: "Bnei Menashe Luangthar",
  nextHolidayShareCardProgress: "Zang Dinga Progress",
  nextHolidayShareCardOf: "in",
  nextHolidayShareCardStepsComplete: "zangkhol dawn",
  nextHolidayShareCardUnchecked: "Lak kik",
  nextHolidayShareAction: "Sawi Chhuak",
  nextHolidayShareCopied: "Copy dawn!",
  nextHolidayShareClose: "Hawl",
  birthdayTrackerTitle: "Hebrew Nirualna Tracker",
  birthdayTrackerSub: "Na nirualna Jewish en sou",
  birthdayTrackerGregorianLabel: "Nirualna ni (Gregorian)",
  birthdayTrackerHebrewLabel: "NA NIRUALNA HEBREW",
  birthdayTrackerNextLabel: "NISA SUANGKHOL",
  birthdayTrackerCalculate: "Kalkulet",
  birthdayTrackerSave: "Na Nirualna Sou",
  birthdayTrackerSaved: "Nirualna sou!",
  birthdayTrackerClear: "Paih",
  birthdayTrackerToday: "Ni tawp na nirualna Hebrew! 🎂",
  birthdayTrackerCardTitle: "NA NIRUALNA HEBREW",
  birthdayTrackerCardDays: "ni en nirualna",
  birthdayTrackerCardSetup: "Na nirualna Hebrew set →",
  modalClose: "Khat",
  yartzeitCardTitle: "YAHRZEIT HLABU",
  yartzeitCardSetup: "Yahrzeit hlabu en →",
  yartzeitCardToday: "Ni tawp Yahrzeit",
  yartzeitCardDays: "ni en",
  yartzeitCardUpcoming: "YAHRZEIT ZANG",
  yartzeitCardManage: "Yahrzeit hlabu en",
  yartzeitCardObservances: "Ni tangkhol:",
  yartzeitCardObservanceText: "🕯 Ni memorial theilawk · 🙏 Kaddish hel · 📖 Torah en dawt",
  yartzeitCardDay: "ni",
  yartzeitCardPushOff: "Ni reminder",
  yartzeitCardPushOn: "Reminder dawn ✓",

  parashaAnnivTitle: "ANNI TANGKHOL",
  parashaAnnivYahrzeit: "Yahrzeit",
  parashaAnnivBirthday: "Nirualna",
  parashaAnnivEvent: "Histori Thu",
  parashaAnnivEmpty: "Anni tangkhol adang om lo",
  parashaAnnivExpand: "Tuni anni tangkhol",

  chatTitle: "Rav Menashe AI",
  chatSubtitle: "Jewish kolam & Torah thu ropui",
  chatWelcomeTitle: "Shalom! Keimah thiam em?",
  chatWelcomeDesc: "Jewish kolam, Torah, thu dawt hun, ni thianghlim, leh Bnei Menashe thu zawng theih.",
  chatPlaceholder: "Shabbat, Zmanim, Torah zawng…",
  chatDisclaimer: "Thu halacha dik tak tan, Rabbi-a din rawh.",
  chatError: "Thlen theih lo. Chhiar dan hrang hmang.",
  chatFabLabel: "Rabbi AI Zawng",
  chatVoiceStart: "Thu sawi rawh",
  chatVoiceStop: "Chhiar mek… paih tan rawh",
  chatVoiceUnsupported: "Voice browser-in support lo",
  chatShare: "Share",
  chatCopied: "Copy!",
  chatSuggestLabel: "Zawk hran",
  chatSuggestedQuestions: [
    "Tuni Parasha eng nge a ni?",
    "Tui kum Shabbat engtia lo nge?",
    "Mussar leh character refinement explain rawh",
    "Daf Yomi eng nge a ni?",
    "Bnei Menashe chanchin sawi rawh",
    "Thu dawt Zmanim zawng zawng en rawh",
  ],
  /* ── Memorial Sanctuary 3D (missing TK keys) ── */
  memTitle: "MIPUI MEMORIAL",
  memSubtitle: "Ngaihtuah leh Hlimna Valley",
  memEnteringSanctuary: "Sanctuary lut mek",
  memSearchPlaceholder: "Innlam mi zawng rawh...",
  memGoldenHour: "Golden Hour",
  memCandlesLit: "Damdawi Hluut",
  memInLovingMemory: "Ngaihna Leh Hlimna",
  memNavHome: "Inn",
  memNavMemorials: "Memorials",
  memHintDrag: "Pan turin zawm rawh",
  memHintPinch: "Zoom turin pinch rawh",
  memHintTap: "Damdawi hluat turin chhuah rawh",
  memLightCandle: "Damdawi Hluat",
  memLightCandleSub: "Sanctuary-ah innlam mi thangthat rawh",
  memFullName: "HER/HI HMINGKHAT",
  memFullNamePlaceholder: "Thi mi hming",
  memHebrewName: "HEBREW HMING",
  memDateOfPassing: "THI NI",
  memMemorialMessage: "MEMORIAL LEHKHA",
  memMessagePlaceholder: "Hrechhuak leh damdawi sawi rawh...",
  memLightingCandle: "Damdawi hluat mek…",
  memLightTheCandle: "Damdawi Hluat Rawh",
  memCandleLit: "Damdawi Hluut",
  memMemoryBlessing: "An hrechhuak chuan an hlimna a ni dawn",
  memDedicatedLearning: "DEDICATED THUZIAK",
  memLeaveTribute: "Tribute Chhut Rawh",
  memYourName: "NA HMING",
  memStudySubject: "THUZIAK SUBJECT",
  memSubmitting: "Submit mek…",
  memDedicate: "Dedicate",
  memTributeRecorded: "Tribute record tlin — hlimna tur a ni dawn",
  memNoResults: "Memorial hmu lo",
  memClearSearch: "Zawng chhiat rawh",
  memCandlesCount: "damdawi",
  memLitBy: "HLUAT TU",
  memPlaceFlower: "Pangpar Chhuah",
  memFlowersBtn: "Pangpar",
  memChooseFlowerColor: "Pangpar hrang dang rawh",
  memPlaceFlowerBtn: "Pangpar Chhuah Rawh",
  memFlowersInGarden: "pangpar hmun ah",
  /* ── Memorial Shell (SPR-015) ── */
  memShellWelcome: "Memorial Sanctuary",
  memShellWelcomeSub: "Bnei Menashe mipui leh in chungchang thu hrechhuak leh ngaihtuah dan inn",
  memShellFeatured: "Featured Memorials",
  memShellRecentCandles: "Tun dinah Damdawi Hluut",
  memShellFamilyMemorials: "In-pum Memorial",
  memShellCreate: "Memorial Siam",
  memShellCreateSub: "Innlam mi in thlarau sanctuary-ah thangthat rawh",
  memShellEnter3D: "3D Sanctuary Lut",
  memShellEnter3DSub: "Memorial Valley immersive trawk rawh",
  memShellResults: "Chhiar Dan",
  memShellViewAll: "Zawng zawng en rawh",
  memShellLoadMore: "Tam zawk load rawh",
  memShellLoading: "Zawng mek…",
  memShellEmptySearch: "Chhiar theih lo",
  memShellSearchError: "Zawng dan palh",
  memShellRetry: "Chhiar leh rawh",
  memShellFeaturedEmpty: "Featured memorials in lo awm",
  memShellFeaturedEmptySub: "Sanctuary-ah memorial siam hmasawn rawh",
  memShellRecentEmpty: "Tun dinah damdawi hluut lo",
  memShellRecentEmptySub: "Memorial khat-ah damdawi hluat in thangthat rawh",
  memShellFamilyEmpty: "In-pum memorial awm lo",
  memShellFamilyEmptySub: "In mi chungchang memorial siam rawh",
  memShellOffline: "I chhungkua lo",
  memShellOfflineSub: "Memorial en turin internet nen inzawm rawh",
  memProfileBorn: "Chhungkhat Ni",
  memProfileDied: "Thi Ni",
  memProfileAge: "Chhuang",
  memProfileYears: "kum",
  memProfileBiography: "Biography",
  memProfileRecentTributes: "Tribute Te",
  memProfileRecentCandles: "Damdawi",
  memProfileUpcomingYahrzeit: "Yahrzeit Hnai",
  memProfileFamilySection: "Chhungkua",
  memProfileLocationSection: "Hmun",
  memProfileActionLight: "Damdawi Hluat",
  memProfileActionTribute: "Tribute Chhut",
  memProfileActionPhotos: "Foto",
  memProfileActionShare: "Share",
  memProfileCopied: "Copy tlin!",
  memProfilePrivateBadge: "Private",
  memProfileFamilyBadge: "Chhungkua",
  memProfileCommunityBadge: "Mipui",
  memProfilePublicBadge: "Public",
  memProfileNotFound: "Memorial Hmu Lo",
  memProfileNotFoundSub: "Memorial hi a lo awm tawh ve thei a, link palh thei bawk.",
  memProfilePrivate: "Private Memorial",
  memProfilePrivateSub: "Chhungkua member te chauhin memorial hi an en thei.",
  memProfileNoBio: "Biography record awm lo.",
  memProfileNoTributes: "Tribute awm lo. Hmasawn rawh.",
  memProfileNoCandles: "Damdawi hluut lo.",
  memProfileNoFamily: "Chhungkua thu hrechhuak awm lo.",
  memProfileNoYahrzeit: "Yahrzeit ni hrechhuak lo.",
  memProfileNoLocation: "Hmun record awm lo.",
  memProfileYahrzeitNext: "Yahrzeit hnai:",
  memProfileYahrzeitToday: "Tun ni Yahrzeit a ni",
  memProfileDaysAway: "ni",
  memCandleTabRecent: "Hnai Ber",
  memCandleTabToday: "Tun Ni",
  memCandleTabCommunity: "Mipui",
  memCandleRelationship: "Inzawmna",
  memCandleCommunityField: "Mipui / Khawlai",
  memCandleRelationshipPlaceholder: "e.g. Fapa, Fate, Rualpa",
  memTributeTypeLabel: "Type",
  memTributeTypeAll: "Thlang Zawk",
  memTributeTypeMemory: "Hriat Tur",
  memTributeTypePrayer: "Duawhna",
  memTributeTypeScripture: "Thuthlung",
  memTributeTypeFamily: "Chhungkua",
  memTributeCommunityType: "Mipui",
  memFamilyManage: "Chhungkua Zirchian",
  memFamilyInvite: "Member Sawm",
  memFamilyUserId: "User ID",
  memFamilySelectRole: "Role thlang rawh",
  memFamilyRoleAdmin: "Zirchian",
  memFamilyRoleMember: "Member",
  memFamilyRoleViewer: "En Zawk",
  memFamilyRemove: "Lak chhuah",
  memFamilyTransfer: "Ownership siamthiam",
  memFamilyInviting: "Sawmna in zawm…",
  memFamilyInvited: "Member sawm tlin",
  memFamilyNoMembers: "Chhungkua member awm lo",
  memFamilyPrimaryContact: "Chiang ber inzawmna",
  memYahrzeitAlertToday: "Tun ni Yahrzeit a ni",
  memYahrzeitAlertSoon: "Yahrzeit a hung hnai ta",
  memYahrzeitSuggestPrayer: "Kaddish chhiar rawh",
  memYahrzeitSuggestPsalm: "Psalm 23 — Mizmor LeDavid",
  memYahrzeitSuggestCandle: "Yahrzeit damdawi hluat rawh",
  memColRecentlyRemembered: "Hriat Tur Hnai Ber",
  memColMostVisited: "Zawk Taka En",
  memColRecentlyLit: "Damdawi Hnai Ber",
  memColUpcomingYahrzeit: "Yahrzeit Hung Hnai",
  memColCommunityPicks: "Mipui Thlang",
  memLoadMore: "Zawk load rawh",
  /* ── Memorial Sanctuary SPR-035 ── */
  memNavFlowers: "Pathian Thu",
  memNavMessages: "Thu Gen",
  memNavMusic: "Hla",
  memSceneValley: "Luang",
  memSceneGarden: "Zung",
  memSceneWaterfall: "Tui Thlak",
  memSceneSanctuary: "Inn Thianghlim",
  memSceneSunset: "Ni Tlai",
  memAmbientOn: "Ambient on",
  memAmbientOff: "Ambient off",
  memNoRecentActivity: "Thil thar om lo.",
  memTodayRemembrance: "NI TIN THILSIM",
  memLightFirstCandle: "Meihal a hmawhna hmat rawh",
  memSceneLoadError: "3D scene a lo thei lo",
  memTimelineTitle: "NUNPUI THILOM",
  memTimelineJourney: "Nunpui Lamka",
  memTimelineRemembered: "Nunnem",
  memWalkEntrance: "Lut Hmun",
  memWalkOverview: "Hmai Thlir",
  memWalkMode: "Kal",

  /* ── Journey Page ── */
  navJourney: "Lamka",
  journeyTitle: "Ka Lamka",
  journeySubtitle: "Na lamka thianghlim",
  journeyEditProfile: "Profile Siam Thar",
  journeyMemberSince: "Member ni hun",
  journeyStreak: "Zir Streak",
  journeyCandles: "Meihal Hmat",
  journeyAchievements: "Thilpek",
  journeyBadgesEarned: "badge dawn",
  journeyActivity: "Thilom Thar",
  journeySaved: "Thilphat Chim",
  journeyGoals: "Ka Beidawn",
  journeyAccount: "Account",
  journeySettings: "Settings",
  journeyPremium: "Premium",
  journeyHelp: "Pui Leh Thupek",
  journeySignOut: "Tawp Ta",
  journeyNoActivity: "Thilom om lo — na lamka phun ta!",
  journeyStudySession: "Zir hun",
  journeyTorahGoal: "Khatvei Torah Beidawn",
  journeyWeeklyProgress: "Khatvei thilphat",
  journeyBookmarks: "Siddur Bookmark",
  journeyOpenSiddur: "Siddur Hawn",
  journeyPersonal: "Ka Thilsim",
  journeyNotSignedIn: "Na lamka en theih dingin lut ta",

  /* ── Notifications Page ── */
  notifPageTitle: "Hlabu Thar",
  notifMarkAllRead: "Thleng Zo Tih",
  notifTabAll: "Zawng",
  notifTabTorah: "Torah",
  notifTabPrayer: "Thu Dawt",
  notifTabHolidays: "Ni Thianghlim",
  notifTabCommunity: "Mipui",
  notifTabAccount: "Account",
  notifEmptyCta: "Zir Ta",
  notifActivityTitle: "Thilom",
  notifQuickActions: "Kal Tawp",
  notifResumeStudy: "Torah Zir Ta",
  notifPrayerTimes: "Thu Dawt Hun",
  notifOpenYahrzeit: "Yahrzeit",
  notifOpenCommunity: "Mipui",
  notifSettingsTitle: "Hlabu Siam Thar",
  notifPrayerReminders: "Ni Tin Thu Dawt",
  notifPrayerRemindersSub: "Shacharit, Mincha & Maariv",
  notifShabbatCandles: "Shabbat Kerhi",
  notifShabbatCandlesSub: "Kerhi hma 18 min",
  notifHavdalahReminder: "Havdalah",
  notifShemaReminder: "Shema Thar Ber",
  notifShemaReminderSub: "Thar ber hlabu",
  notifTorahReminders: "Parasha Khatvei",
  notifTorahRemindersSub: "Farlang chawk hlabu",
  notifHolidayReminders: "Ni Thianghlim Hlabu",
  notifHolidayRemindersSub: "Ni hma ni khat",
  notifYahrzeitReminders: "Yahrzeit Hlabu",
  notifOmerCount: "Omer Chhiar",
  notifShabbatDigest: "Shabbat Digest",
  notifShabbatDigestSub: "Khatvei Farlang chawk",
  notifLeadTime: "Hlabu Hma Hun",
  notifPushNotifications: "Push Hlabu",
  notifPushSubscribe: "Push On",
  notifPushUnsubscribe: "Push Off",
  notifPushTest: "Test Hlabu Thawn",
  notifPermissionDenied: "Hlabu a block — browser siam dan-ah on siam rawh.",
  notifRetry: "Chhiar Leh",
  notifNoActivity: "Thilom om lo — na lamka phun ta!",
  notifStartStudy: "Torah zir phun ta →",
  notifFilterUnread: "Ziak Lo",
  notifFilterRead: "Ziak Zo",
  notifAllCaughtUp: "Na thleng zo",
  notifAllCaughtUpSub: "Hlabu thar om lo.",
  notifQuietHours: "Beng Hun",
  notifQuietHoursDesc: "Hei hun-ah hlabu zawng beng rawh",
  notifQuietFrom: "Atanga",
  notifQuietTo: "Inkar",
  notifPushActive: "Push hlabu a on mek",
  notifPushInactive: "App a tawp a lo, hlabu dawng theih tur",
  notifSignInMsg: "Na thilom en theih dingin lut ta.",
  notifErrorTitle: "Thil dang a tlung",
  notifErrorSub: "Na hlabu load theih lo.",
  notifUnread: "ziak lo",
  notifBack: "Kir Leh",

  remembranceTitle: "Hriatna Hmun",
  remembranceSubtitle: "Na chhungkua hming, ni leh thil hriat tur te hnai-ah vawng rawh.",
  remembranceAdd: "Hriatna belh rawh",
  remembranceUpcoming: "Lo kal mek",
  remembranceYahrzeits: "Yahrzeit te",
  remembranceBirthdays: "Pianni te",
  remembranceAnniversaries: "Kum tin hriatna",
  remembranceEvents: "Chhungkua hriatna",
  remembranceNoEvents: "I hriatna hmun hi a inpeih zo",
  remembranceNoEventsSub: "Yahrzeit, pianni emaw kum tin hriatna belh rawh.",
  remembranceLoading: "I hriatna hmun load mek",
  remembranceLoadError: "I hriatna te load thei lo.",
  remembranceRetry: "Chhiar leh rawh",
  remembranceToday: "Tun ni",
  remembranceTomorrow: "Naktuk",
  remembranceInDays: "Ni {n} chhungah",
  remembranceYahrzeit: "Yahrzeit",
  remembranceBirthday: "Pianni",
  remembranceAnniversary: "Kum tin hriatna",
  remembranceNewEvent: "Hriatna thar",
  remembranceEditEvent: "Hriatna siam danglam",
  remembranceDetails: "Hriatna thu te",
  remembranceName: "Hming",
  remembranceRelationship: "Inzawmna",
  remembranceEventType: "Hriatna chi",
  remembranceDate: "Ni",
  remembranceMonth: "Thla",
  remembranceYear: "Kum",
  remembranceDayLabel: "Ni",
  remembranceHebrewDate: "Hebrew ni",
  remembranceGregorianDate: "Gregorian ni",
  remembranceUseHebrewDate: "Hebrew ni hmang rawh",
  remembranceBeforeSunset: "Ni tla hma-a hman ni",
  remembranceRepeatAnnually: "Kum tin laktir rawh",
  remembranceLocation: "Hmun",
  remembranceNotes: "Thu belh",
  remembranceNotesPlaceholder: "Hriatna, malsawmna, emaw chhungkua thu",
  remembranceNotifications: "Hriat tirna",
  remembranceEnableNotifications: "He ni chungchangah hriat tir rawh",
  remembranceDaysBefore: "Ni hma",
  remembranceNotificationTime: "Hriat tir hun",
  remembranceCensusLink: "Census mi nen inzawm rawh",
  remembranceCensusNone: "Mi inzawm awm lo",
  remembranceCensusLoading: "Chhungkua mi zawng mek",
  remembranceCensusUnavailable: "Census inzawmna hi tunah a awm lo.",
  remembranceSave: "Hriatna vawng rawh",
  remembranceCancel: "Thiat rawh",
  remembranceDelete: "Paih rawh",
  remembranceDeleteConfirm: "He hriatna hi paih dawn em?",
  remembranceDeleteBody: "He chhungkua hriatna hi i calendar atangin paih a ni ang.",
  remembranceConfirmDelete: "Hriatna paih rawh",
  remembranceShare: "Sem rawh",
  remembranceCopied: "Hriatna thu copy tlin.",
  remembranceShareFailed: "He device-ah sem theihna a awm lo.",
  remembranceClose: "Khawng rawh",
  remembranceRequired: "Hming leh ni ziak rawh.",
  remembranceSaved: "Hriatna vawng tlin",
  remembranceDays: "ni",
  remembranceDay: "ni",
  remembranceNoDate: "Ni siam lo",
  remembranceAddYahrzeit: "Yahrzeit belh rawh",
  remembranceAddBirthday: "Pianni belh rawh",
  remembranceAddAnniversary: "Hriatna belh rawh",
  remembranceShareFamilyCalendar: "Chhungkua Calendar Sem Rawh",
  remembrance20YearSchedule: "Kum 20 chhungah lo kal mek",
  remembranceExportICS: "Calendar-ah export rawh (.ics)",
  remembranceICSDownloaded: "Chhungkua calendar download tlin",
  remembranceNoYahrzeits: "Yahrzeit awm lo",
  remembranceNoBirthdays: "Pianni awm lo",
  remembranceNoAnniversaries: "Hriatna awm lo",
};

const translations: Record<Lang, Translations> = { en, tk };
export default translations;
