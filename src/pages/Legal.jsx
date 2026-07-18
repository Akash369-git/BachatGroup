import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Legal() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="font-heading font-bold text-xl">Legal</h1>
          <p className="text-xs text-muted-foreground">Privacy Policy & Terms of Service</p>
        </div>
      </div>

      <Tabs defaultValue="privacy" className="w-full">
        <TabsList className="w-full bg-muted rounded-xl h-11">
          <TabsTrigger value="privacy" className="flex-1 rounded-lg text-xs gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Privacy Policy
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex-1 rounded-lg text-xs gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Terms of Service
          </TabsTrigger>
        </TabsList>

        {/* ── Privacy Policy ── */}
        <TabsContent value="privacy" className="mt-4 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <p className="text-xs text-muted-foreground">Last updated: July 2026</p>
              <h2 className="font-heading font-bold text-lg text-foreground mt-1">Privacy Policy</h2>
              <p className="mt-2">
                BachatGroup ("we", "our", or "us") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, and safeguard your information
                when you use our group savings application.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">1. Information We Collect</h3>
              <ul className="space-y-1.5 list-disc list-inside">
                <li><span className="font-medium text-foreground">Account information:</span> Your name, email address, and profile details when you register.</li>
                <li><span className="font-medium text-foreground">Group data:</span> Groups you create or join, contribution amounts, and withdrawal requests.</li>
                <li><span className="font-medium text-foreground">Transaction records:</span> Records of contributions marked as paid and withdrawal voting history.</li>
                <li><span className="font-medium text-foreground">Usage data:</span> How you interact with the app (pages visited, actions taken).</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">2. How We Use Your Information</h3>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>To provide and maintain the BachatGroup service.</li>
                <li>To send notifications about group activity (contributions due, withdrawal requests, votes).</li>
                <li>To display your name and contribution history to other members of your groups.</li>
                <li>To improve our application and fix bugs.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">3. Information Sharing</h3>
              <p>
                We do <span className="font-medium text-foreground">not</span> sell your personal data to third parties.
                Your information is shared only with:
              </p>
              <ul className="space-y-1.5 list-disc list-inside mt-2">
                <li><span className="font-medium text-foreground">Other group members:</span> Your name, email, and contribution status are visible to members of groups you belong to.</li>
                <li><span className="font-medium text-foreground">Supabase:</span> Our database and authentication provider. Data is stored securely on Supabase servers.</li>
                <li><span className="font-medium text-foreground">Google:</span> If you use "Sign in with Google", Google shares your basic profile with us.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">4. Data Security</h3>
              <p>
                We implement industry-standard security measures including HTTPS encryption,
                Row Level Security (RLS) on our database, and secure authentication.
                However, no method of transmission over the internet is 100% secure.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">5. Data Retention</h3>
              <p>
                We retain your data as long as your account is active. You can request
                deletion of your account and associated data by contacting us. Group
                financial records may be retained for up to 1 year after group closure
                for dispute resolution purposes.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">6. Your Rights</h3>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Access your personal data.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your account.</li>
                <li>Withdraw consent at any time.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">7. Contact Us</h3>
              <p>
                For privacy-related questions or to exercise your rights, contact us at:
                <span className="font-medium text-foreground"> support@bachatgroup.com</span>
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ── Terms of Service ── */}
        <TabsContent value="terms" className="mt-4 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <p className="text-xs text-muted-foreground">Last updated: July 2026</p>
              <h2 className="font-heading font-bold text-lg text-foreground mt-1">Terms of Service</h2>
              <p className="mt-2">
                By using BachatGroup, you agree to these Terms of Service. Please read them carefully.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">1. About BachatGroup</h3>
              <p>
                BachatGroup is a <span className="font-medium text-foreground">group savings tracking tool</span>.
                We help friends and family track contributions and manage withdrawal requests transparently.
                We are <span className="font-medium text-foreground">not</span> a bank, financial institution,
                payment processor, or licensed chit fund operator. We do not hold, transfer, or guarantee any money.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">2. User Responsibilities</h3>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>You must be at least 18 years old to use BachatGroup.</li>
                <li>You are responsible for all activity under your account.</li>
                <li>All actual money transfers happen directly between group members — BachatGroup only tracks them.</li>
                <li>You agree to use the platform honestly and not misrepresent contributions.</li>
                <li>You are responsible for resolving disputes with other group members.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">3. Group Rules</h3>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Group admins are responsible for managing their group members.</li>
                <li>Withdrawal requests require approval from all eligible group members.</li>
                <li>BachatGroup is not responsible for any financial disputes between group members.</li>
                <li>Groups operate on mutual trust between members.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">4. Prohibited Activities</h3>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Using BachatGroup for illegal purposes.</li>
                <li>Creating fake accounts or impersonating others.</li>
                <li>Attempting to hack, disrupt, or misuse the platform.</li>
                <li>Using BachatGroup to conduct unlicensed financial services.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">5. Disclaimer of Liability</h3>
              <p>
                BachatGroup is provided "as is" without warranties of any kind.
                We are not liable for any financial losses, disputes between members,
                or damages arising from use of the platform. All financial decisions
                are made between group members at their own risk.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">6. Changes to Terms</h3>
              <p>
                We may update these terms from time to time. Continued use of BachatGroup
                after changes constitutes acceptance of the new terms.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">7. Governing Law</h3>
              <p>
                These terms are governed by the laws of India. Any disputes shall be
                subject to the jurisdiction of courts in India.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">8. Contact</h3>
              <p>
                Questions about these terms? Contact us at:
                <span className="font-medium text-foreground"> support@bachatgroup.com</span>
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}