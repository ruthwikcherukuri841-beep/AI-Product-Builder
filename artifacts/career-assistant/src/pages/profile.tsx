import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Briefcase, FileText, Target } from "lucide-react";
import { Link } from "wouter";

const profileSchema = z.object({
  fullName: z.string().optional().nullable(),
  resume: z.string().optional().nullable(),
  jobDescription: z.string().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      resume: "",
      jobDescription: "",
    }
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (profile && !initializedRef.current) {
      form.reset({
        fullName: profile.fullName || "",
        resume: profile.resume || "",
        jobDescription: profile.jobDescription || "",
      });
      initializedRef.current = true;
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(
      { data },
      {
        onSuccess: (updatedProfile) => {
          queryClient.setQueryData(getGetProfileQueryKey(), updatedProfile);
          toast({
            title: "Profile updated",
            description: "Your context has been saved successfully.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update profile. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
      
      <header className="h-16 flex items-center px-6 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/chat")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Chat</span>
        </Button>
      </header>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Profile & Context</h1>
            <p className="text-muted-foreground">
              This information is automatically shared with Lumina at the start of every session, allowing for highly personalized and relevant advice.
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <FormLabel className="text-base font-semibold m-0">Full Name</FormLabel>
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="Jane Doe" 
                          {...field} 
                          value={field.value || ""} 
                          className="bg-background border-border/50 h-12" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="w-full h-px bg-border/40 my-6"></div>

                <FormField
                  control={form.control}
                  name="resume"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <FormLabel className="text-base font-semibold m-0">Resume / Work History</FormLabel>
                      </div>
                      <FormDescription className="text-xs mb-3">
                        Paste the plain text of your resume here. Lumina will use this to suggest improvements, tailor interview questions, and identify skill gaps.
                      </FormDescription>
                      <FormControl>
                        <Textarea 
                          placeholder="EXPERIENCE&#10;Software Engineer at Acme Corp&#10;..."
                          className="min-h-[200px] font-mono text-sm bg-background border-border/50" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="w-full h-px bg-border/40 my-6"></div>

                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <FormLabel className="text-base font-semibold m-0">Target Job Description</FormLabel>
                      </div>
                      <FormDescription className="text-xs mb-3">
                        Paste the description of the role you're currently aiming for. Lumina will compare this against your resume.
                      </FormDescription>
                      <FormControl>
                        <Textarea 
                          placeholder="Role: Senior Product Manager&#10;Requirements: 5+ years experience, data-driven..." 
                          className="min-h-[150px] font-mono text-sm bg-background border-border/50" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateProfile.isPending}
                    className="w-full sm:w-auto px-8 h-12 text-base font-medium shadow-md shadow-primary/20"
                  >
                    {updateProfile.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      "Save Context"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
}