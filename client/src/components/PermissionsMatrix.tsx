import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Lock,
  Unlock,
  Search,
  Filter,
  Eye,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
} from "lucide-react";
import {
  ActivityVerificationStatus,
  PermissionAssignment,
  RelationshipDecision,
  RelationshipMode,
  relationshipModeOptions,
  rolePermissionMatrix,
  UserRole,
  VerificationStatus,
} from "@/data/permissionsMatrix";
import { toast } from "sonner";

type VerificationState = {
  kycStatus: VerificationStatus;
  kybStatus: VerificationStatus;
  businessVerified: boolean;
  activeMembership: boolean;
  individualActivityStatus: ActivityVerificationStatus;
  businessActivityStatus: ActivityVerificationStatus;
  offeringVerified: boolean;
  relationshipMode: RelationshipMode;
  relationshipDecision: RelationshipDecision;
};

export default function PermissionsMatrix() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("OWNER");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [verificationState, setVerificationState] = useState<VerificationState>({
    kycStatus: "VERIFIED",
    kybStatus: "VERIFIED",
    businessVerified: true,
    activeMembership: true,
    individualActivityStatus: "VERIFIED",
    businessActivityStatus: "VERIFIED",
    offeringVerified: true,
    relationshipMode: "b2b",
    relationshipDecision: "allow",
  });

  const roleData = useMemo(
    () => rolePermissionMatrix.find(r => r.role === selectedRole),
    [selectedRole]
  );

  const filteredPermissions = useMemo(() => {
    if (!roleData) return [];

    return ((roleData as any).permissions || []).filter((p: any) => {
      // Filter by search term
      const matchesSearch =
        p.permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.permission.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by category
      const matchesCategory =
        categoryFilter === "ALL" || p.permission.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [roleData, searchTerm, categoryFilter]);

  const getPermissionStatus = (permission: PermissionAssignment) => {
    const {
      kycStatus,
      kybStatus,
      businessVerified,
      activeMembership,
      individualActivityStatus,
      businessActivityStatus,
      offeringVerified,
      relationshipMode,
      relationshipDecision,
    } = verificationState;

    const kycMet = permission.requiresKYC ? kycStatus === "VERIFIED" : true;
    const kybMet = permission.requiresKYB ? kybStatus === "VERIFIED" : true;
    const businessMet = permission.requiresVerifiedBusiness ? businessVerified : true;
    const membershipMet = permission.requiresActiveMembership ? activeMembership : true;
    const individualActivityMet = permission.requiresIndividualActivity ? individualActivityStatus === "VERIFIED" : true;
    const businessActivityMet = permission.requiresBusinessActivityVerification ? businessActivityStatus === "VERIFIED" : true;
    const offeringMet = permission.requiresOfferingVerification ? offeringVerified : true;
    const relationshipModeMet = permission.allowedRelationshipModes?.length
      ? permission.allowedRelationshipModes.includes(relationshipMode)
      : true;
    const relationshipMet = permission.requiresRelationship ? relationshipDecision === "allow" : true;
    const coreRequirementsMet =
      kycMet &&
      kybMet &&
      businessMet &&
      membershipMet &&
      individualActivityMet &&
      businessActivityMet &&
      offeringMet &&
      relationshipModeMet &&
      relationshipMet;
    const requiresManualReview = Boolean(
      permission.manualReviewForModes?.includes(relationshipMode) ||
        (permission.requiresRelationship && relationshipDecision === "manual_review"),
    );
    const decision: RelationshipDecision = requiresManualReview && coreRequirementsMet
      ? "manual_review"
      : coreRequirementsMet
        ? "allow"
        : "deny";

    return {
      decision,
      isGranted: decision === "allow",
      kycMet,
      kybMet,
      businessMet,
      membershipMet,
      individualActivityMet,
      businessActivityMet,
      offeringMet,
      relationshipModeMet,
      relationshipMet,
      unmetRequirements: [
        !kycMet && "KYC موثق",
        !kybMet && "KYB موثق",
        !businessMet && "شركة موثقة",
        !membershipMet && "عضوية فعالة",
        !individualActivityMet && "ملف نشاط فردي موثق",
        !businessActivityMet && "تحقق نشاط تجاري",
        !offeringMet && "تحقق العرض",
        !relationshipModeMet && "نمط علاقة مسموح",
        !relationshipMet && "علاقة تجارية",
      ].filter(Boolean) as string[],
    };
  };

  const grantedCount = useMemo(
    () => filteredPermissions.filter((p: any) => getPermissionStatus(p).isGranted).length,
    [filteredPermissions]
  );

  const categories = ["ALL", "READ", "CREATE", "UPDATE", "DELETE", "APPROVE", "EXPORT"] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-purple-400" />
          <h2 className="text-3xl font-bold text-white">مصفوفة الصلاحيات التفاعلية</h2>
        </div>
        <p className="text-slate-400 text-base">
          عرض تفاعلي للأذونات المتاحة لكل دور بناءً على حالة التحقق والعلاقة التجارية (RBAC + ABAC)
        </p>
      </div>

      {/* Verification State Selector */}
      <Card className="bg-slate-900/80 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            محاكاة حالة التحقق
          </CardTitle>
          <CardDescription className="text-slate-400">
            اختر حالة التحقق لمحاكاة السيناريوهات المختلفة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">حالة KYC</label>
              <Select
                value={verificationState.kycStatus}
                onValueChange={(value) =>
                  setVerificationState(prev => ({
                    ...prev,
                    kycStatus: value as VerificationStatus,
                  }))
                }
              >
                <SelectTrigger className="bg-slate-950 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_VERIFIED">غير موثق</SelectItem>
                  <SelectItem value="VERIFIED">موثق</SelectItem>
                  <SelectItem value="SUSPENDED">معلق</SelectItem>
                  <SelectItem value="REJECTED">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">حالة KYB</label>
              <Select
                value={verificationState.kybStatus}
                onValueChange={(value) =>
                  setVerificationState(prev => ({
                    ...prev,
                    kybStatus: value as VerificationStatus,
                  }))
                }
              >
                <SelectTrigger className="bg-slate-950 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_VERIFIED">غير موثق</SelectItem>
                  <SelectItem value="VERIFIED">موثق</SelectItem>
                  <SelectItem value="SUSPENDED">معلق</SelectItem>
                  <SelectItem value="REJECTED">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">الشركة موثقة؟</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={verificationState.businessVerified ? "default" : "outline"}
                  onClick={() =>
                    setVerificationState(prev => ({
                      ...prev,
                      businessVerified: true,
                    }))
                  }
                  className={verificationState.businessVerified ? "bg-green-600" : "border-slate-700"}
                >
                  نعم
                </Button>
                <Button
                  size="sm"
                  variant={!verificationState.businessVerified ? "default" : "outline"}
                  onClick={() =>
                    setVerificationState(prev => ({
                      ...prev,
                      businessVerified: false,
                    }))
                  }
                  className={!verificationState.businessVerified ? "bg-red-600" : "border-slate-700"}
                >
                  لا
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">عضوية فعّالة؟</label>
              <div className="flex gap-2">
                <Button size="sm" variant={verificationState.activeMembership ? "default" : "outline"} onClick={() => setVerificationState(prev => ({ ...prev, activeMembership: true }))} className={verificationState.activeMembership ? "bg-green-600" : "border-slate-700"}>نعم</Button>
                <Button size="sm" variant={!verificationState.activeMembership ? "default" : "outline"} onClick={() => setVerificationState(prev => ({ ...prev, activeMembership: false }))} className={!verificationState.activeMembership ? "bg-red-600" : "border-slate-700"}>لا</Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">ملف النشاط الفردي</label>
              <Select value={verificationState.individualActivityStatus} onValueChange={(value) => setVerificationState(prev => ({ ...prev, individualActivityStatus: value as ActivityVerificationStatus }))}>
                <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_SUBMITTED">غير مقدم</SelectItem>
                  <SelectItem value="PENDING">قيد المراجعة</SelectItem>
                  <SelectItem value="VERIFIED">موثق</SelectItem>
                  <SelectItem value="SUSPENDED">معلق</SelectItem>
                  <SelectItem value="REJECTED">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">تحقق النشاط التجاري</label>
              <Select value={verificationState.businessActivityStatus} onValueChange={(value) => setVerificationState(prev => ({ ...prev, businessActivityStatus: value as ActivityVerificationStatus }))}>
                <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_SUBMITTED">غير مقدم</SelectItem>
                  <SelectItem value="PENDING">قيد المراجعة</SelectItem>
                  <SelectItem value="VERIFIED">موثق</SelectItem>
                  <SelectItem value="SUSPENDED">معلق</SelectItem>
                  <SelectItem value="REJECTED">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">العرض موثق؟</label>
              <div className="flex gap-2">
                <Button size="sm" variant={verificationState.offeringVerified ? "default" : "outline"} onClick={() => setVerificationState(prev => ({ ...prev, offeringVerified: true }))} className={verificationState.offeringVerified ? "bg-green-600" : "border-slate-700"}>نعم</Button>
                <Button size="sm" variant={!verificationState.offeringVerified ? "default" : "outline"} onClick={() => setVerificationState(prev => ({ ...prev, offeringVerified: false }))} className={!verificationState.offeringVerified ? "bg-red-600" : "border-slate-700"}>لا</Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">نمط العلاقة</label>
              <Select value={verificationState.relationshipMode} onValueChange={(value) => setVerificationState(prev => ({ ...prev, relationshipMode: value as RelationshipMode }))}>
                <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {relationshipModeOptions.map((mode) => <SelectItem key={mode.value} value={mode.value}>{mode.label} — {mode.description}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">نتيجة قرار العلاقة</label>
              <Select value={verificationState.relationshipDecision} onValueChange={(value) => setVerificationState(prev => ({ ...prev, relationshipDecision: value as RelationshipDecision }))}>
                <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">سماح</SelectItem>
                  <SelectItem value="manual_review">مراجعة يدوية</SelectItem>
                  <SelectItem value="deny">رفض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role and Filter Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">اختر الدور</label>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <SelectTrigger className="bg-slate-900 border-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rolePermissionMatrix.map(role => (
                <SelectItem key={role.role} value={role.role}>
                  {role.roleName} — {role.roleDescription}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">تصنيف الصلاحية</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-slate-900 border-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === "ALL" ? "جميع التصنيفات" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">البحث</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="ابحث عن صلاحية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-slate-900 border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Role Info */}
      {roleData && (
        <Card className="bg-gradient-to-r from-slate-900/80 to-slate-950/80 border-slate-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{roleData.roleName}</h3>
                <p className="text-sm text-slate-400">{roleData.roleDescription}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-300 mb-2">الأنشطة المدعومة</h4>
                <div className="flex flex-wrap gap-1">
                  {roleData.businessTypes.map(type => (
                    <Badge key={type} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">{grantedCount}</div>
                <div className="text-xs text-slate-400">صلاحية متاحة من {filteredPermissions.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Table */}
      <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">قائمة الصلاحيات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-300 font-semibold">الصلاحية</TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">الحالة</TableHead>
                  <TableHead className="text-slate-300 font-semibold">المتطلبات</TableHead>
                  <TableHead className="text-slate-300 font-semibold">ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.length === 0 ? (
                  <TableRow className="border-slate-800">
                    <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                      لا توجد صلاحيات مطابقة للبحث
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPermissions.map((p: PermissionAssignment, idx: number) => {
                    const status = getPermissionStatus(p);
                    return (
                      <TableRow key={idx} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                        <TableCell className="py-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{p.permission.icon}</span>
                              <span className="font-semibold text-white">{p.permission.name}</span>
                              <Badge variant="outline" className="text-xs bg-slate-800 text-slate-300 border-slate-700">
                                {p.permission.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400">{p.permission.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {status.decision === "allow" ? (
                            <div className="flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                              <span className="text-xs font-semibold text-green-400">متاح</span>
                            </div>
                          ) : status.decision === "manual_review" ? (
                            <div className="flex items-center justify-center gap-1">
                              <AlertCircle className="w-5 h-5 text-amber-400" />
                              <span className="text-xs font-semibold text-amber-400">مراجعة يدوية</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Lock className="w-5 h-5 text-red-400" />
                              <span className="text-xs font-semibold text-red-400">محظور</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {[
                              { label: "KYC", met: status.kycMet, required: p.requiresKYC },
                              { label: "KYB", met: status.kybMet, required: p.requiresKYB },
                              { label: "Business", met: status.businessMet, required: p.requiresVerifiedBusiness },
                              { label: "Membership", met: status.membershipMet, required: p.requiresActiveMembership },
                              { label: "Individual Activity", met: status.individualActivityMet, required: p.requiresIndividualActivity },
                              { label: "Business Activity", met: status.businessActivityMet, required: p.requiresBusinessActivityVerification },
                              { label: "Offering", met: status.offeringMet, required: p.requiresOfferingVerification },
                              { label: "Relationship Mode", met: status.relationshipModeMet, required: Boolean(p.allowedRelationshipModes?.length) },
                              { label: "Relationship", met: status.relationshipMet, required: p.requiresRelationship },
                            ]
                              .filter(r => r.required)
                              .map((req, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  {req.met ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                  ) : (
                                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                  )}
                                  <span className={req.met ? "text-green-400" : "text-red-400"}>
                                    {req.label}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">{p.notes}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-slate-900/80 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white">شرح المتطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">KYC</h4>
                <p className="text-xs text-slate-400 mt-1">التحقق من الهوية الشخصية</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">KYB</h4>
                <p className="text-xs text-slate-400 mt-1">التحقق من الكيان التجاري</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Business Verified</h4>
                <p className="text-xs text-slate-400 mt-1">الشركة موثقة بالكامل</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Relationship</h4>
                <p className="text-xs text-slate-400 mt-1">علاقة تجارية معتمدة</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Activity Profile</h4>
                <p className="text-xs text-slate-400 mt-1">ملف نشاط فردي موثق بعد KYC</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Business Activity</h4>
                <p className="text-xs text-slate-400 mt-1">تحقق تشغيلي للنشاط بعد KYB والعضوية</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Manual Review</h4>
                <p className="text-xs text-slate-400 mt-1">B2G يبقى مراجعة يدوية ولا يتحول لتفاعل تشغيلي</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              ملاحظات مهمة
            </h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• هذه الواجهة إسقاط توثيقي تفاعلي؛ اختيار الدور أو الحالة هنا لا يمنح صلاحية خادمية.</li>
              <li>• القرار يعكس KYC وKYB والعضوية والنشاط الفردي أو التجاري والعرض ونمط العلاقة.</li>
              <li>• قد تكون النتيجة متاحاً أو محظوراً أو مراجعة يدوية؛ B2G لا يتجاوز المراجعة ضمن هذا الإصدار.</li>
              <li>• العمليات الحساسة وقرارات العلاقة الفعلية تتطلب إنفاذاً خادمياً وأثر تدقيق مصنف.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
