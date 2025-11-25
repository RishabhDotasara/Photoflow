import { useState } from 'react';
import { Loader2, CheckCircle, Mail, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

interface FormData {
    email: string;
    reason: string;
}

export function AccessRequestForm() {
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [emailError, setEmailError] = useState('');
    const [reasonError, setReasonError] = useState('');

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        return emailRegex.test(email);
    };

    const validateForm = (): boolean => {
        let isValid = true;

        // Validate email
        if (!email.trim()) {
            setEmailError('Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            setEmailError('Please enter a valid email');
            isValid = false;
        } else {
            setEmailError('');
        }

        // Validate reason
        if (!reason.trim()) {
            setReasonError('Please provide a reason');
            isValid = false;
        } else if (reason.trim().length < 10) {
            setReasonError('Minimum 10 characters required');
            isValid = false;
        } else {
            setReasonError('');
        }

        return isValid;
    };

    const submitMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/create-access-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    reason: reason,    
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit request');
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success('Request submitted successfully!');
            setEmail('');
            setReason('');
        },
        onError: () => {
            toast.error('Something went wrong. Please try again.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        submitMutation.mutate();
    };

    // Success state
    if (submitMutation.isSuccess) {
        return (
            <Card className="w-full max-w-md border-border bg-card">
                <CardContent className="pt-8 pb-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">Request Submitted!</h3>
                            <p className="text-sm text-muted-foreground">
                                We'll review your request and get back to you soon.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => submitMutation.reset()}
                            className="mt-4"
                        >
                            Submit Another Request
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md border-border bg-card">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl text-foreground">Request Access</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Tell us why you'd like access to PhotoFlow
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError('');
                                }}
                                placeholder="you@example.com"
                                className={`pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''
                                    }`}
                                disabled={submitMutation.isPending}
                            />
                        </div>
                        {emailError && (
                            <p className="text-xs text-destructive">{emailError}</p>
                        )}
                    </div>

                    {/* Reason Field */}
                    <div className="space-y-2">
                        <label htmlFor="reason" className="text-sm font-medium text-foreground">
                            Reason
                        </label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    if (reasonError) setReasonError('');
                                }}
                                placeholder="Why do you need access?"
                                rows={3}
                                className={`pl-10 pt-2 bg-background border-input text-foreground placeholder:text-muted-foreground resize-none ${reasonError ? 'border-destructive focus-visible:ring-destructive' : ''
                                    }`}
                                disabled={submitMutation.isPending}
                            />
                        </div>
                        {reasonError && (
                            <p className="text-xs text-destructive">{reasonError}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={submitMutation.isPending}
                    >
                        {submitMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Submit Request
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}